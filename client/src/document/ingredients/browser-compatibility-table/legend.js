import React from "react";

// function buildIndexNotes(
//   browserSupportDetails,
//   rowIndex,
//   currentNoteId,
//   hasFlag,
//   hasPrefix,
//   hasAlternative,
//   hasNotes
// ) {
//   const indexNotes = browserSupportDetails.map(
//     ({ browser, support, version_added }, detailIndex) => {
//       if (Array.isArray(support)) {
//         const [notes, flags, prefixes, alternatives] = [[], [], [], []];
//
//         for (const supportItem of support) {
//           if (!!supportItem.alternative_name) {
//             hasAlternative = true;
//             alternatives.push(supportItem);
//           } else if (!!supportItem.prefix) {
//             hasPrefix = true;
//             prefixes.push(supportItem);
//           } else if (Array.isArray(supportItem.flags)) {
//             hasFlag = true;
//             flags.concat(supportItem.flags);
//           } else if (!!supportItem.notes) {
//             hasNotes = true;
//             if (Array.isArray(supportItem.notes)) {
//               notes.concat(supportItem.notes);
//             } else {
//               notes.push(supportItem.notes);
//             }
//           }
//         }
//
//         return {
//           index: `${rowIndex}-${detailIndex}`,
//           browser,
//           version_added,
//           support,
//           prefixes,
//           alternatives,
//           flags,
//           notes,
//         };
//       } else {
//         if (!hasFlag) {
//           hasFlag = !!(support && support.flags);
//         }
//         if (!hasPrefix) {
//           hasPrefix = !!(support && support.prefix);
//         }
//         if (!hasNotes) {
//           hasNotes = !!(support && support.notes);
//         }
//
//         const prefixes = !!(support && support.prefix) ? [support] : [];
//         const alternatives = !!(support && support.alternative_name)
//           ? [support]
//           : [];
//         const flags = !!(support && support.flags) ? support.flags : [];
//         const notes = gatherNotesForIndexNote(support);
//
//         return {
//           index: `${rowIndex}-${detailIndex}`,
//           browser,
//           version_added,
//           support,
//           prefixes,
//           alternatives,
//           flags,
//           notes,
//         };
//       }
//     }
//   );
//
//   const filteredIndexNotes = indexNotes.filter(
//     (indexNotes) => `bc-history-${indexNotes.index}` === currentNoteId
//   );
//
//   return [filteredIndexNotes, hasFlag, hasPrefix, hasAlternative, hasNotes];
// }

export function Legend({ compatibilityData }) {
  let [
    hasDeprecation,
    hasExperimental,
    hasNonStandard,
    hasFlag,
    hasPrefix,
    hasAlternative,
    hasNotes,
  ] = [false, false, false, false, false, false, false];
  // const compatibility = buildCompatibilityObject(
  //   compatibilityData.query,
  //   compatibilityData.data
  // );
  // for (const key in compatibility) {
  //   const currentRow = compatibility[key];
  //
  //   if (currentRow.status) {
  //     if (!hasDeprecation) {
  //       hasDeprecation = !!currentRow.status.deprecated;
  //     }
  //     if (!hasExperimental) {
  //       hasExperimental = !!currentRow.status.experimental;
  //     }
  //     if (!hasNonStandard) {
  //       hasNonStandard = !!currentRow.status.standard_track;
  //     }
  //   }
  //
  //   const browserSupportDetails = displayBrowsers.map((browser) => {
  //     const support = currentRow.support[browser];
  //     const version_added = getVersionAdded(support);
  //     return { browser, support, version_added };
  //   });
  //
  //   [
  //     hasFlag,
  //     hasPrefix,
  //     hasAlternative,
  //     hasNotes,
  //   ] = buildIndexNotes(
  //     browserSupportDetails,
  //     key,
  //     currentNoteId,
  //     hasFlag,
  //     hasPrefix,
  //     hasAlternative,
  //     hasNotes
  //   );
  // }
  return (
    <section className="bc-legend">
      <h3 className="offscreen highlight-spanned" id="Legend">
        <span className="highlight-span">Legend</span>
      </h3>
      <dl>
        <dt>
          <span className="bc-supports-yes bc-supports">
            <abbr
              className="bc-level bc-level-yes only-icon"
              title="Full support"
            >
              <span>Full support</span>
            </abbr>
          </span>
        </dt>
        <dd>Full support</dd>
        <dt>
          <span className="bc-supports-no bc-supports">
            <abbr className="bc-level bc-level-no only-icon" title="No support">
              <span>No support</span>
            </abbr>
          </span>
        </dt>
        <dd>No support</dd>
        <dt>
          <span className="bc-supports-unknown bc-supports">
            <abbr
              className="bc-level bc-level-unknown only-icon"
              title="Compatibility unknown"
            >
              <span>Compatibility unknown</span>
            </abbr>
          </span>
        </dt>
        <dd>Compatibility unknown</dd>
        {hasNotes && (
          <>
            <dt>
              <abbr className="only-icon" title="See implementation notes.">
                <span>See implementation notes.</span>
                <i className="ic-footnote" />
              </abbr>
            </dt>
            <dd>See implementation notes.</dd>
          </>
        )}
        {hasDeprecation && (
          <>
            <dt>
              <abbr
                className="only-icon"
                title="Deprecated. Not for use in new websites."
              >
                <span>Deprecated. Not for use in new websites.</span>
                <i className="ic-deprecated" />
              </abbr>
            </dt>
            <dd>Deprecated. Not for use in new websites.</dd>
          </>
        )}
        {hasExperimental && (
          <>
            <dt>
              <abbr
                className="only-icon"
                title="Experimental. Expect behavior to change in the future."
              >
                <span>
                  Experimental. Expect behavior to change in the future.
                </span>
                <i className="ic-experimental" />
              </abbr>
            </dt>
            <dd>Experimental. Expect behavior to change in the future.</dd>
          </>
        )}
        {hasNonStandard && (
          <>
            <dt>
              <abbr
                className="only-icon"
                title="Non-standard. Expect poor cross-browser support."
              >
                <span>Non-standard. Expect poor cross-browser support.</span>
                <i className="ic-non-standard" />
              </abbr>
            </dt>
            <dd>Non-standard. Expect poor cross-browser support.</dd>
          </>
        )}
        {hasFlag && (
          <>
            <dt>
              <abbr
                className="only-icon"
                title="User must explicitly enable this feature."
              >
                <span>User must explicitly enable this feature.</span>
                <i className="ic-disabled" />
              </abbr>
            </dt>
            ,<dd>User must explicitly enable this feature.</dd>
          </>
        )}
        {hasPrefix && (
          <>
            <dt>
              <abbr
                className="only-icon"
                title="Requires a vendor prefix or different name for use."
              >
                <span>Requires a vendor prefix or different name for use.</span>
                <i className="ic-prefix" />
              </abbr>
            </dt>
            <dd>Requires a vendor prefix or different name for use.</dd>
          </>
        )}
        {hasAlternative && (
          <>
            <dt>
              <abbr className="only-icon" title="Uses a non-standard name.">
                <span>Uses a non-standard name.</span>
                <i className="ic-altname" />
              </abbr>
            </dt>
            <dd>Uses a non-standard name.</dd>
          </>
        )}
      </dl>
    </section>
  );
}
