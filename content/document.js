const fs = require("fs");
const path = require("path");

const fm = require("front-matter");
const glob = require("glob");
const yaml = require("js-yaml");

const {
  CONTENT_ARCHIVE_ROOT,
  CONTENT_ROOT,
  VALID_LOCALES,
} = require("./constants");
const { memoizeDuringBuild, slugToFoldername } = require("./utils");

function buildPath(localeFolder, slug) {
  return path.join(localeFolder, slugToFoldername(slug));
}

const HTML_FILENAME = "index.html";
const getHTMLPath = (folder) => path.join(folder, HTML_FILENAME);
const getWikiHistoryPath = (folder) => path.join(folder, "wikihistory.json");

function updateWikiHistory(localeContentRoot, oldSlug, newSlug = null) {
  const all = JSON.parse(
    fs.readFileSync(path.join(localeContentRoot, "_wikihistory.json"))
  );
  if (oldSlug in all) {
    if (newSlug) {
      all[newSlug] = all[oldSlug];
    }
    delete all[oldSlug];
    fs.writeFileSync(
      path.join(localeContentRoot, "_wikihistory.json"),
      JSON.stringify(all, null, 2)
    );
  }
}

function extractLocale(folder) {
  // E.g. 'pr-br'
  const localeFolderName = folder.split(path.sep)[0];
  // E.g. 'pt-BR'
  const locale = VALID_LOCALES.get(localeFolderName);
  // This checks that the extraction worked *and* that the locale found
  // really is in VALID_LOCALES *and* it ultimately returns the
  // locale as we prefer to spell it (e.g. 'pt-BR' not 'Pt-bR')
  if (!locale) {
    throw new Error(`Unable to figure out locale from ${folder}`);
  }
  return locale;
}

function saveHTMLFile(filePath, rawHtml, { slug, title, summary, tags }) {
  const metadata = {
    title,
    slug,
    summary,
  };
  if (tags) {
    metadata.tags = tags;
  }
  const combined = `---\n${yaml.safeDump(metadata)}---\n${rawHtml.trim()}\n`;
  fs.writeFileSync(filePath, combined);
}

function trimLineEndings(string) {
  return string
    .split("\n")
    .map((s) => s.trimEnd())
    .join("\n");
}

function urlToFolderPath(url) {
  const [, locale, , ...slugParts] = url.split("/");
  return path.join(locale.toLowerCase(), slugToFoldername(slugParts.join("/")));
}

function create(html, metadata) {
  const folder = buildPath(
    path.join(CONTENT_ROOT, metadata.locale),
    metadata.slug
  );

  fs.mkdirSync(folder, { recursive: true });

  saveHTMLFile(getHTMLPath(folder), trimLineEndings(html), metadata);
}

function archive(renderedHTML, rawHTML, metadata, wikiHistory) {
  const folder = buildPath(
    path.join(CONTENT_ARCHIVE_ROOT, metadata.locale),
    metadata.slug
  );

  fs.mkdirSync(folder, { recursive: true });

  // The `rawHtml` is only applicable in the importer when it saves
  // archived content. The archived content gets the *rendered* html
  // saved but by storing the raw html too we can potentially resurrect
  // the document if we decide to NOT archive it in the future.
  fs.writeFileSync(path.join(folder, "raw.html"), trimLineEndings(rawHTML));

  fs.writeFileSync(
    getWikiHistoryPath(folder),
    JSON.stringify(wikiHistory, null, 2)
  );

  saveHTMLFile(getHTMLPath(folder), trimLineEndings(renderedHTML), metadata);
}

class Document {
  constructor(attributes) {
    Object.assign(this, attributes);
  }

  get url() {
    const { locale, slug } = this.metadata;
    return `/${locale}/docs/${slug}`;
  }
}

const read = memoizeDuringBuild((folder, fields = null) => {
  fields = fields ? { body: false, metadata: false, ...fields } : fields;
  const filePath = path.join(CONTENT_ROOT, getHTMLPath(folder));
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const rawContent = fs.readFileSync(filePath, "utf8");
  const {
    attributes: metadata,
    body: rawHtml,
    bodyBegin: frontMatterOffset,
  } = fm(rawContent);

  metadata.locale = extractLocale(folder);

  return new Document({
    ...(!fields || fields.metadata ? { metadata } : {}),
    ...(!fields || fields.body ? { rawHtml, rawContent } : {}),
    fileInfo: {
      path: filePath,
      frontMatterOffset,
    },
  });
});

function update(folder, rawHtml, metadata) {
  const document = read(folder);
  const oldSlug = document.metadata.slug;
  const newSlug = metadata.slug;
  const isNewSlug = oldSlug !== newSlug;

  if (
    isNewSlug ||
    document.rawHtml !== rawHtml ||
    document.metadata.title !== metadata.title ||
    document.metadata.summary !== metadata.summary
  ) {
    saveHTMLFile(getHTMLPath(folder), rawHtml, {
      ...document.metadata,
      ...metadata,
    });
    if (isNewSlug) {
      updateWikiHistory(
        path.join(CONTENT_ROOT, metadata.locale.toLowerCase()),
        oldSlug,
        newSlug
      );
    }
  }

  if (isNewSlug) {
    for (const { metadata, rawHtml, fileInfo } of findChildren(url)) {
      const oldChildSlug = metadata.slug;
      const newChildSlug = oldChildSlug.replace(oldSlug, newSlug);
      metadata.slug = newChildSlug;
      updateWikiHistory(
        path.join(CONTENT_ROOT, metadata.locale.toLowerCase()),
        oldChildSlug,
        newChildSlug
      );
      saveHTMLFile(fileInfo.path, rawHtml, metadata);
    }
    const newFolder = buildPath(
      path.join(CONTENT_ROOT, metadata.locale.toLowerCase()),
      newSlug
    );

    // XXX we *could* call out to a shell here and attempt
    // to execute `git mv $folder $newFolder` and only if that didn't work
    // do we fall back on good old `fs.renameSync`.
    fs.renameSync(folder, newFolder);
  }
}

function del(folder) {
  const { metadata } = read(folder, { metadata: true });
  fs.rmdirSync(folder, { recursive: true });
  updateWikiHistory(path.join(CONTENT_ROOT, metadata.locale), metadata.slug);
}

const findByURL = memoizeDuringBuild((url, fields = null) => {
  const folder = urlToFolderPath(url);

  const document = read(folder, fields);

  return document ? { contentRoot: CONTENT_ROOT, folder, document } : null;
});

function findChildren(url, fields = null) {
  const folder = urlToFolderPath(url);
  const childPaths = glob.sync(
    path.join(CONTENT_ROOT, folder, "*", HTML_FILENAME),
    {
      ignore: path.join(CONTENT_ROOT, getHTMLPath(folder)),
    }
  );
  return childPaths
    .map((childFilePath) =>
      path.relative(CONTENT_ROOT, path.dirname(childFilePath))
    )
    .map((folder) => read(folder, fields));
}

/**
 * Atm this is NextJS and Vercel specific, as they come with limiations:
 * - NextJS doesn't allow special characters in the URL
 * - Vercel only allows for 16k URLs in the free version
 */
function listURLs() {
  const popularities = JSON.parse(
    fs.readFileSync(path.join(CONTENT_ROOT, "..", "popularities.json"), "utf-8")
  );
  return Object.keys(popularities).filter(
    (url) =>
      url.startsWith("/en-US") &&
      ![":", "*", "?"].some((char) => url.includes(char))
  );
}

module.exports = {
  buildPath,

  create,
  archive,
  read,
  update,
  del,

  findByURL,
  findChildren,

  listURLs,
};
