import React, { useContext } from "react";
import { Link } from "@reach/router";
import type bcd from "mdn-browser-compat-data/types";
import { useAccordion, useAccordionParent } from "./accordion";
import { BrowserInfoContext, BrowserName } from "./browser-info";
import { asList, getFirst, isTruthy } from "./utils";

function getSupportClassName(
  support: bcd.SupportStatement | undefined
): string {
  if (!support) {
    return "unknown";
  }

  let { version_added, version_removed, partial_implementation } = getFirst(
    support
  );

  let className;
  if (version_added === null) {
    className = "unknown";
  } else if (version_added) {
    className = "yes";
    if (version_removed) {
      className = "no";
    }
  } else {
    className = "no";
  }
  if (partial_implementation && !version_removed) {
    className = "partial";
  }

  return className;
}

function StatusIcons({ status }: { status: bcd.StatusBlock }) {
  const icons = [
    status.experimental && {
      title: "Experimental. Expect behavior to change in the future.",
      text: "Experimental",
      iconClassName: "ic-experimental",
    },
    status.deprecated && {
      title: "Deprecated. Not for use in new websites.",
      text: "Deprecated",
      iconClassName: "ic-deprecated",
    },
    !status.standard_track && {
      title: "Non-standard. Expect poor cross-browser support.",
      text: "Non-standard",
      iconClassName: "ic-non-standard",
    },
  ].filter(isTruthy);
  return icons.length === 0 ? null : (
    <div className="bc-icons">
      {icons.map((icon) => (
        <abbr key={icon.iconClassName} className="only-icon" title={icon.title}>
          <span>{icon.text}</span>
          <i className={icon.iconClassName} />
        </abbr>
      ))}
    </div>
  );
}

function CellText({ support }: { support: bcd.SupportStatement | undefined }) {
  const currentSupport = getFirst(support);

  const added = currentSupport && currentSupport.version_added;
  const removed = currentSupport && currentSupport.version_removed;

  let status:
    | { isSupported: "unknown" }
    | { isSupported: "no" | "yes" | "partial"; label?: string };

  switch (added) {
    case null:
      status = { isSupported: "unknown" };
      break;
    case true:
      status = { isSupported: "yes" };
      break;
    case false:
      status = { isSupported: "no" };
      break;
    default:
      status = { isSupported: "yes", label: added };
      break;
  }

  if (removed) {
    status = {
      isSupported: "no",
      label:
        (typeof added === "string" ? added : "?") +
        "&nbsp;— " +
        (typeof removed === "string" ? removed : "?"),
    };
  } else if (currentSupport && currentSupport.partial_implementation) {
    status = {
      isSupported: "partial",
      label: typeof added === "string" ? added : "Partial",
    };
  }

  let label, title;
  switch (status.isSupported) {
    case "yes":
      title = "Full support";
      label = status.label || "Yes";
      break;

    case "partial":
      title = "Partial support";
      label = status.label || "Partial";
      break;

    case "no":
      title = "No support";
      label = status.label || "No";
      break;

    case "unknown":
      title = "Compatibility unknown; please update this.";
      label = "?";
      break;
  }

  return (
    <>
      <abbr
        className={`bc-level-${getSupportClassName(currentSupport)} only-icon`}
        title={title}
      >
        <span>{title}</span>
      </abbr>
      {label}
    </>
  );
}

function CompatCell({
  rowIndex,
  browser,
  support,
}: {
  rowIndex: number;
  browser: bcd.BrowserNames;
  support: bcd.SupportStatement | undefined;
}) {
  const [isOpen, toggle] = useAccordion(rowIndex, browser);
  const supportClassName = getSupportClassName(support);
  const hasNotes =
    support &&
    asList(support).some(
      (item) => item.prefix || item.notes || item.alternative_name || item.flags
    );
  return (
    <td
      className={`bc-browser-${browser} bc-supports-${supportClassName} ${
        hasNotes ? "bc-has-history" : ""
      }`}
      aria-expanded={isOpen ? "true" : "false"}
      tabIndex={hasNotes ? 0 : undefined}
      onClick={
        hasNotes
          ? () => {
              toggle();
            }
          : undefined
      }
    >
      <span className="bc-browser-name">
        <BrowserName id={browser} />
      </span>
      <CellText {...{ support }} />
      <CellIcons support={support} />
      {hasNotes && (
        <button
          type="button"
          title="Open implementation notes"
          className={`bc-history-link only-icon ${
            isOpen ? "bc-history-link-inverse" : ""
          }`}
        >
          <span>Open</span>
          <i className="ic-history" aria-hidden="true" />
        </button>
      )}
    </td>
  );
}

function Icon({ name }: { name: string }) {
  return (
    <abbr className="only-icon" title={name}>
      <span>{name}</span>
      <i className={`ic-${name}`} />
    </abbr>
  );
}

function CellIcons({ support }: { support: bcd.SupportStatement | undefined }) {
  const supportItem = getFirst(support);
  if (!supportItem) {
    return null;
  }
  return (
    <div className="bc-icons">
      {supportItem.prefix && <Icon name="prefix" />}
      {supportItem.notes && <Icon name="footnote" />}
      {supportItem.alternative_name && <Icon name="altname" />}
      {supportItem.flags && <Icon name="disabled" />}
    </div>
  );
}

function FlagsNote({
  supportItem,
  browser,
}: {
  supportItem: bcd.SimpleSupportStatement;
  browser: bcd.BrowserNames;
}) {
  const browserInfo = useContext(BrowserInfoContext);
  if (!browserInfo) {
    throw new Error("Missing browser info");
  }
  const info = browserInfo[browser];

  const hasAddedVersion = typeof supportItem.version_added === "string";
  const hasRemovedVersion = typeof supportItem.version_removed === "string";
  const flags = supportItem.flags || [];
  return (
    <>
      {hasAddedVersion && `From version ${supportItem.version_added}`}
      {hasRemovedVersion && (
        <>
          {hasAddedVersion ? "Until" : "until"} version{" "}
          {supportItem.version_removed} (exclusive)
        </>
      )}
      {hasAddedVersion || hasRemovedVersion ? ": this" : "This"}
      feature is behind the
      {flags.map((flag, i) => {
        const valueToSet = flag.value_to_set && (
          <>
            {" "}
            (needs to be set to <code>{flag.value_to_set}</code>)
          </>
        );
        return (
          <React.Fragment key={flag.name}>
            <code>{flag.name}</code>
            {flag.type === "preference" && <> preferences{valueToSet}</>}
            {flag.type === "runtime_flag" && <> runtime flag{valueToSet}</>}
            {i < flags.length - 1 && " and the "}
          </React.Fragment>
        );
      })}
      .
      {flags.some((flag) => flag.type === "preference") &&
        ` To change preferences in ${info.name}, visit ${info.pref_url}.`}
    </>
  );
}

function getNotes(browser: bcd.BrowserNames, support: bcd.SupportStatement) {
  return asList(support)
    .flatMap((item, i) => {
      const supportNotes = [
        item.prefix && { iconName: "prefix", label: "prefix" },
        item.notes &&
          (Array.isArray(item.notes)
            ? item.notes
            : [item.notes]
          ).map((note) => ({ iconName: "footnote", label: note })),
        item.alternative_name && {
          iconName: "altname",
          label: item.alternative_name,
        },
        item.flags && {
          iconName: "disabled",
          label: <FlagsNote browser={browser} supportItem={item} />,
        },
      ]
        .flat()
        .filter(isTruthy);

      const hasNotes = supportNotes.length > 0;
      return (
        (i === 0 || hasNotes) && (
          <React.Fragment key={i}>
            <dt
              className={`bc-supports-${getSupportClassName(
                support
              )} bc-supports`}
            >
              <CellText support={item} />
              <CellIcons support={item} />
            </dt>
            {supportNotes.map(({ iconName, label }) => (
              <React.Fragment key={iconName}>
                <Icon name={iconName} /> {label}
              </React.Fragment>
            ))}
            {!hasNotes && <dd />}
          </React.Fragment>
        )
      );
    })
    .filter(isTruthy);
}

export function FeatureRow({
  index,
  feature,
  browsers,
}: {
  index: number;
  feature: {
    name: string;
    compat: bcd.CompatStatement;
    isRoot: boolean;
  };
  browsers: bcd.BrowserNames[];
}) {
  const showNotesFor = useAccordionParent(index);
  const { name, compat, isRoot } = feature;
  const title = compat.description ? (
    <span dangerouslySetInnerHTML={{ __html: compat.description }} />
  ) : (
    <code>{name}</code>
  );

  return (
    <>
      <tr>
        <th scope="row">
          {compat.mdn_url && !isRoot ? (
            <Link to={compat.mdn_url}>{title}</Link>
          ) : (
            title
          )}
          {compat.status && <StatusIcons status={compat.status} />}
        </th>
        {browsers.map((browser) => (
          <CompatCell
            key={browser}
            rowIndex={index}
            browser={browser}
            support={compat.support[browser]}
          />
        ))}
      </tr>
      {showNotesFor && (
        <tr className="bc-history">
          <th scope="row" />
          <td colSpan={browsers.length}>
            <dl>{getNotes(showNotesFor, compat.support[showNotesFor]!)}</dl>
          </td>
        </tr>
      )}
    </>
  );
}
