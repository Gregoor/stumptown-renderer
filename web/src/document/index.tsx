import Link from "next/link";
import React, { useEffect, useState } from "react";

// Ingredients
import { Prose, ProseWithHeading } from "./ingredients/prose";
import { InteractiveExample } from "./ingredients/interactive-example";
import { Attributes } from "./ingredients/attributes";
import { Examples } from "./ingredients/examples";
import { LinkList, LinkLists } from "./ingredients/link-lists";
import { Specifications } from "./ingredients/specifications";
import { BrowserCompatibilityTable } from "./ingredients/browser-compatibility-table";
// Misc
// Sub-components
import { DocumentTranslations } from "./languages";

// import "./index.scss";

// Lazy sub-components
// const Toolbar = lazy(() => import("./toolbar"));

export function Document({ doc } /* TODO: define a TS interface for this */) {
  useEffect(() => {
    if (doc) {
      document.title = doc.title;
    }
  }, [doc]);

  if (!doc) {
    return null;
  }

  const translations = [...(doc.other_translations || [])];
  if (doc.translation_of) {
    translations.unshift({
      locale: "en-US",
      slug: doc.translation_of,
    });
  }

  const { github_url, folder } = doc.source;

  return (
    <>
      {/*{process.env.NODE_ENV === "development" && (*/}
      {/*  <Suspense fallback={<p className="loading-toolbar">Loading toolbar</p>}>*/}
      {/*    <Toolbar*/}
      {/*      doc={doc}*/}
      {/*      onDocumentUpdate={() => {*/}
      {/*        fetchDocument();*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  </Suspense>*/}
      {/*)}*/}
      <h1 className="page-title">{doc.title}</h1>
      {translations && !!translations.length && (
        <DocumentTranslations translations={translations} />
      )}
      <div className="main">
        <nav>{doc.parents && <Breadcrumbs parents={doc.parents} />}</nav>

        <div className="sidebar">
          <RenderSideBar doc={doc} />
        </div>
        <div className="content">
          <RenderDocumentBody doc={doc} />
          <hr />
          <a
            href={github_url}
            title={`Folder: ${folder}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Edit on <b>GitHub</b>
          </a>
          {" | "}
          <a
            href={`https://developer.mozilla.org${doc.mdn_url}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on <b>MDN</b>
          </a>
          {doc.contributors && <Contributors contributors={doc.contributors} />}
        </div>
      </div>
    </>
  );
}

function Breadcrumbs({ parents }) {
  if (!parents.length) {
    throw new Error("Empty parents array");
  }
  return (
    <ol
      typeof="BreadcrumbList"
      vocab="https://schema.org/"
      aria-label="breadcrumbs"
    >
      {parents.map((parent, i) => {
        const isLast = i + 1 === parents.length;
        return (
          <li key={parent.uri} property="itemListElement" typeof="ListItem">
            <Link href={parent.uri}>
              <a
                className={isLast ? "crumb-current-page" : "breadcrumb-chevron"}
                property="item"
                typeof="WebPage"
              >
                <span property="name">{parent.title}</span>
              </a>
            </Link>
            <meta property="position" content={i + 1} />
          </li>
        );
      })}
    </ol>
  );
}

function RenderSideBar({ doc }) {
  if (!doc.related_content) {
    if (doc.sidebarHTML) {
      return <div dangerouslySetInnerHTML={{ __html: doc.sidebarHTML }} />;
    }
    return null;
  }
  return doc.related_content.map((node) => (
    <SidebarLeaf key={node.title} parent={node} />
  ));
}

function SidebarLeaf({ parent }) {
  return (
    <div>
      <h3>{parent.title}</h3>
      <ul>
        {parent.content.map((node) => {
          if (node.content) {
            return (
              <li key={node.title}>
                <SidebarLeaflets node={node} />
              </li>
            );
          } else {
            return (
              <li key={node.uri}>
                <Link href={node.uri}>{node.title}</Link>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
}

function SidebarLeaflets({ node }) {
  return (
    <details open={node.open}>
      <summary>
        {node.uri ? <Link href={node.uri}>{node.title}</Link> : node.title}
      </summary>
      <ol>
        {node.content.map((childNode) => {
          if (childNode.content) {
            return (
              <li key={childNode.title}>
                <SidebarLeaflets node={childNode} />
              </li>
            );
          } else {
            return (
              <li
                key={childNode.uri}
                className={childNode.isActive && "active"}
              >
                <Link href={childNode.uri}>{childNode.title}</Link>
              </li>
            );
          }
        })}
      </ol>
    </details>
  );
}

/** These prose sections should be rendered WITHOUT a heading. */
const PROSE_NO_HEADING = ["short_description", "overview"];

function RenderDocumentBody({ doc }) {
  return doc.body.map((section, i) => {
    if (section.type === "prose") {
      // Only exceptional few should use the <Prose/> component,
      // as opposed to <ProseWithHeading/>.
      if (!section.value.id || PROSE_NO_HEADING.includes(section.value.id)) {
        return (
          <Prose
            key={section.value.id || `prose${i}`}
            section={section.value}
          />
        );
      } else {
        return (
          <ProseWithHeading
            key={section.value.id}
            id={section.value.id}
            section={section.value}
          />
        );
      }
    } else if (section.type === "interactive_example") {
      return (
        <InteractiveExample
          key={section.value.url}
          url={section.value.url}
          height={section.value.height}
          title={doc.title}
        />
      );
    } else if (section.type === "attributes") {
      return <Attributes key={`attributes${i}`} attributes={section.value} />;
    } else if (section.type === "specifications") {
      return (
        <Specifications
          key={`specifications${i}`}
          specifications={section.value}
        />
      );
    } else if (section.type === "browser_compatibility") {
      return (
        <BrowserCompatibilityTable
          key={`browser_compatibility${i}`}
          {...section.value}
        />
      );
    } else if (section.type === "examples") {
      return <Examples key={`examples${i}`} examples={section.value} />;
    } else if (section.type === "info_box") {
      // XXX Unfinished!
      // https://github.com/mdn/stumptown-content/issues/106
      console.warn("Don't know how to deal with info_box!");
      return null;
    } else if (
      section.type === "class_constructor" ||
      section.type === "static_methods" ||
      section.type === "instance_methods"
    ) {
      return (
        <LinkList
          key={`${section.type}${i}`}
          title={section.value.title}
          links={section.value.content}
        />
      );
    } else if (section.type === "link_lists") {
      return <LinkLists key={`linklists${i}`} lists={section.value} />;
    } else {
      console.warn(section);
      throw new Error(`No idea how to handle a '${section.type}' section`);
    }
  });
}

function Contributors({ contributors }) {
  return (
    <div>
      <b>Contributors to this page:</b>
      <span dangerouslySetInnerHTML={{ __html: contributors }} />
    </div>
  );
}

function LoadingError({ error }) {
  return (
    <div className="loading-error">
      <h3>Loading Error</h3>
      {error instanceof window.Response ? (
        <p>
          <b>{error.status}</b> on <b>{error.url}</b>
          <br />
          <small>{error.statusText}</small>
        </p>
      ) : (
        <p>
          <code>{error.toString()}</code>
        </p>
      )}
      <p>
        <a href=".">Try reloading the page</a>
      </p>
    </div>
  );
}
