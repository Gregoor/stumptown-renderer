import React from "react";
import { Link } from "@reach/router";
import { BrowserSupportDetail } from "./browser-support-detail";
import { BrowserSupportNotes } from "./browser-support-notes";

function buildCompatibilityObject(query, compatibilityData) {
  const features = {};

  if (!!compatibilityData.__compat) {
    // The first row in the BCD data is the overall topic for the page, and
    // does not have its name within the data. Retrieve the name from the query
    // data and set a flag so that we do not render a `Link` for it since we
    // are already on that page.
    const name = query.split(".").pop();
    features[name] = { ...compatibilityData.__compat, isFirst: true };
  }
  for (const compat in compatibilityData) {
    if (compat !== "__compat" && !!compatibilityData[compat]["__compat"]) {
      features[compat] = compatibilityData[compat]["__compat"];
    }
  }

  return features;
}

function getVersionAdded(support) {
  // When version compatibility is "unknown", it will be `undefined`.
  // In that case, return `null` so we render the "?" block.
  if (support === undefined) {
    return null;
  }

  if (Array.isArray(support)) {
    return support[0].version_added;
  }

  return support.version_added;
}

function getIndexNoteForBrowserDetail(indexNotes, browserDetailIndex) {
  return indexNotes.find(
    (indexNotes) => indexNotes.index === browserDetailIndex
  );
}

function BrowserSupportDetails({
  browserSupportDetails,
  rowIndex,
  indexNotes,
  currentNoteId,
  onNotesClick,
}) {
  return browserSupportDetails.map((detail, detailIndex) => (
    <BrowserSupportDetail
      key={detailIndex}
      index={`${rowIndex}-${detailIndex}`}
      browser={detail.browser}
      support={detail.support}
      versionAdded={detail.version_added}
      currentNoteId={currentNoteId}
      onNotesClick={onNotesClick}
      indexNote={getIndexNoteForBrowserDetail(
        indexNotes,
        `${rowIndex}-${detailIndex}`
      )}
    />
  ));
}

function buildIndexNotes(browserSupportDetails, rowIndex, currentNoteId) {
  return browserSupportDetails
    .filter(
      (indexNotes, detailIndex) =>
        `bc-history-${rowIndex}-${detailIndex}` === currentNoteId
    )
    .map(({ browser, support, version_added }) => {
      if (Array.isArray(support)) {
        const [notes, flags, prefixes, alternatives] = [[], [], [], []];

        for (const supportItem of support) {
          if (supportItem.alternative_name) {
            alternatives.push(supportItem);
          } else if (supportItem.prefix) {
            prefixes.push(supportItem);
          } else if (Array.isArray(supportItem.flags)) {
            flags.concat(supportItem.flags);
          } else if (supportItem.notes) {
            if (Array.isArray(supportItem.notes)) {
              notes.concat(supportItem.notes);
            } else {
              notes.push(supportItem.notes);
            }
          }
        }

        return {
          browser,
          version_added,
          support,
          prefixes,
          alternatives,
          flags,
          notes,
        };
      }

      return {
        browser,
        version_added,
        support,
        prefixes: !!(support && support.prefix) ? [support] : [],
        alternatives: !!(support && support.alternative_name) ? [support] : [],
        flags: !!(support && support.flags) ? support.flags : [],
        notes: gatherNotesForIndexNote(support),
      };
    });
}

// Find notes inside a support object and return as an array
function gatherNotesForIndexNote(currentSupport) {
  if (!currentSupport) {
    return [];
  }

  if (Array.isArray(currentSupport.notes)) {
    return currentSupport.notes;
  }

  return !!currentSupport.notes ? [currentSupport.notes] : [];
}

export function Rows({
  compatibilityData,
  displayBrowsers,
  onNotesClick,
  currentNoteId,
}) {
  const compatibility = buildCompatibilityObject(
    compatibilityData.query,
    compatibilityData.data
  );
  return Object.entries(compatibility).map(([key, row]) => {
    const browserSupportDetails = displayBrowsers.map((browser) => {
      const support = row.support[browser];
      const version_added = getVersionAdded(support);
      return { browser, support, version_added };
    });
    const indexNotes = buildIndexNotes(
      browserSupportDetails,
      key,
      currentNoteId
    );
    return (
      <React.Fragment key={key}>
        <tr>
          <th scope="row">
            {row.mdn_url && !row.isFirst ? (
              <Link to={row.mdn_url}>
                <code>{key}</code>
              </Link>
            ) : (
              <code>{key}</code>
            )}
            {row.status && (
              <div className="bc-icons">
                {row.status.deprecated && (
                  <abbr
                    className="only-icon"
                    title="Deprecated. Not for use in new websites."
                  >
                    <span>Deprecated</span>
                    <i className="ic-deprecated" />
                  </abbr>
                )}
                {!row.status.standard_track && (
                  <abbr
                    className="only-icon"
                    title="Non-standard. Expect poor cross-browser support."
                  >
                    <span>Non-standard</span>
                    <i className="ic-non-standard" />
                  </abbr>
                )}
                {row.status.experimental && (
                  <abbr
                    className="only-icon"
                    title="Experimental. Expect behavior to change in the future."
                  >
                    <span>Experimental</span>
                    <i className="ic-experimental" />
                  </abbr>
                )}
              </div>
            )}
          </th>
          <BrowserSupportDetails
            browserSupportDetails={browserSupportDetails}
            rowIndex={key}
            indexNotes={indexNotes}
            currentNoteId={currentNoteId}
            onNotesClick={onNotesClick}
          />
        </tr>
        {indexNotes.map((indexNote) => (
          <tr
            key={`notes-${indexNote.index}`}
            id={`bc-history-${indexNote.index}`}
            className="bc-history"
            aria-hidden="false"
          >
            <th scope="row" />
            <td colSpan={browserSupportDetails.length}>
              <dl>
                <BrowserSupportNotes
                  indexNote={indexNote}
                  blockElementTag="dt"
                  noteElementTag="dd"
                />
              </dl>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  });
}
