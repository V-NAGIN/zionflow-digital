import fs from "node:fs";
import vm from "node:vm";

const page = fs.readFileSync("website-demo-builder/index.html", "utf8");
const sharing = fs.readFileSync("website-demo-builder/share.js", "utf8");

new vm.Script(sharing, {filename:"share.js"});
const inline = page.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/i);
if (!inline) throw new Error("The demo builder inline script is missing");
new vm.Script(inline[1], {filename:"website-demo-builder/index.html"});

for (const needle of [
  'id="quoteLink"',
  'id="logo"',
  'id="sitePreview"',
  'id="shareStatus"',
  'id="shareDownloads"',
  'src="./share.js"',
  "zf-demo-rendered",
  "html2canvas.min.js"
]) {
  if (!page.includes(needle)) throw new Error("Missing builder integration: " + needle);
}

for (const needle of ["navigator.share", "website-demo.png", "website-demo.html", "wa.me/27833110552"]) {
  if (!sharing.includes(needle)) throw new Error("Missing file-sharing behavior: " + needle);
}

if (!page.includes('type="button" id="quoteLink"') && !page.includes('id="quoteLink" type="button"')) {
  throw new Error("The request button must remain a native button");
}

console.log("ZionFlow custom demo source and sharing integration: OK");
