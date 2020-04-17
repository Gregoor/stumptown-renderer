import React from "react";
import { VersionBlock } from "./version-block";

export function BrowserSupportNote({
  browser,
  versionAdded,
  versionRemoved,
  noteContent,
  noteType,
  blockElementTag,
  noteElementTag,
  displayBlock,
  displayNote,
}) {
  return (
    <>
      {displayBlock && (
        <VersionBlock
          icon={noteType}
          browser={browser}
          versionAdded={versionAdded}
          versionRemoved={versionRemoved}
          elementTag={blockElementTag}
        />
      )}
      {React.createElement(
        noteElementTag,
        {
          className: "padded-note",
        },
        displayNote ? noteContent : <span />
      )}
    </>
  );
}
