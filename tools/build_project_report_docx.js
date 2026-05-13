const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const input = path.join(root, "generated_report_text.txt");
const buildDir = path.join(root, "project_report_docx_build");

function escXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function para(text, opts = {}) {
  const alignment = opts.alignment ? `<w:jc w:val="${opts.alignment}"/>` : "";
  const pageBreak = opts.pageBreak ? "<w:pageBreakBefore/>" : "";
  const spacing = `<w:spacing w:before="${opts.before ?? 0}" w:after="${opts.after ?? 80}" w:line="${opts.line ?? 240}" w:lineRule="auto"/>`;
  const size = opts.size ?? "22";
  const bold = opts.bold ? "<w:b/>" : "";
  const font = opts.font ?? "Times New Roman";
  const textNode = text.length
    ? `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:sz w:val="${size}"/>${bold}</w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`
    : `<w:r><w:t></w:t></w:r>`;

  return `<w:p><w:pPr>${pageBreak}${alignment}${spacing}</w:pPr>${textNode}</w:p>`;
}

function isCenteredLine(line) {
  return /^\s{8,}\S/.test(line);
}

function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(CHAPTER\s+\d+|Outcome of Literature Survey|Abstract|Acknowledgement|CERTIFICATE|INDEX|References|Conclusion)$/i.test(trimmed)) {
    return true;
  }
  if (/^\d+(\.\d+)*\s+[A-Z]/.test(trimmed)) return true;
  return trimmed.length < 70 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
}

const raw = fs.readFileSync(input, "utf8").replace(/\r\n/g, "\n");
const pages = raw.split("\f");
const body = [];

pages.forEach((page, pageIndex) => {
  const lines = page.split("\n");
  let firstOnPage = true;

  lines.forEach((line) => {
    const trimmed = line.trimEnd();
    const content = trimmed.trim();
    const pageBreak = pageIndex > 0 && firstOnPage;
    firstOnPage = false;

    if (!content) {
      body.push(para("", { pageBreak, after: 120 }));
      return;
    }

    const titleLike = isHeading(content);
    body.push(para(trimmed, {
      pageBreak,
      alignment: isCenteredLine(trimmed) || pageIndex < 3 ? "center" : undefined,
      bold: titleLike,
      size: titleLike ? "24" : "22",
      font: "Courier New",
      after: titleLike ? 120 : 40,
      line: 240,
    }));
  });
});

cleanDir(buildDir);
ensureDir(path.join(buildDir, "_rels"));
ensureDir(path.join(buildDir, "docProps"));
ensureDir(path.join(buildDir, "word"));
ensureDir(path.join(buildDir, "word", "_rels"));

fs.writeFileSync(path.join(buildDir, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

fs.writeFileSync(path.join(buildDir, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

fs.writeFileSync(path.join(buildDir, "docProps", "app.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>`);

fs.writeFileSync(path.join(buildDir, "docProps", "core.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>AI Recipe Generator Project Report</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`);

fs.writeFileSync(path.join(buildDir, "word", "_rels", "document.xml.rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);

fs.writeFileSync(path.join(buildDir, "word", "document.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`);

console.log(buildDir);
