import { GetStaticProps } from "next";

const {
  findDocumentTranslations,
} = require("../../../../content/translations");
const { Document, CONTENT_TRANSLATED_ROOT } = require("../../../../content");
const { buildDocument } = require("../../../../build");

import { DocumentLayout } from "../../../src/app";
import { Document as DocumentView } from "../../../src/document";

async function buildDocumentFromURL(url) {
  const document = Document.findByURL(url);
  if (!document) {
    return null;
  }
  const documentOptions = {
    // The only times the server builds on the fly is basically when
    // you're in "development mode". And when you're not building
    // to ship you don't want the cache to stand have any hits
    // since it might prevent reading fresh data from disk.
    clearKumascriptRenderCache: true,
  };
  if (CONTENT_TRANSLATED_ROOT) {
    // When you're running the dev server and build documents
    // every time a URL is requested, you won't have had the chance to do
    // the phase that happens when you do a regular `yarn build`.
    document.translations = findDocumentTranslations(document);
  }
  return await buildDocument(document, documentOptions);
}

export const getStaticProps: GetStaticProps = async (context) => {
  console.log({ context });
  return {
    props: { doc: await buildDocumentFromURL(context.params) },
  };
};

export default function DocumentPage(props) {
  return (
    <DocumentLayout>
      <DocumentView {...props} />
    </DocumentLayout>
  );
}
