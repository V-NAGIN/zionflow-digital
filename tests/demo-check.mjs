import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page = fs.readFileSync('website-demo-builder/index.html', 'utf8');
const sharing = fs.readFileSync('website-demo-builder/share.js', 'utf8');

new vm.Script(sharing, {filename: 'share.js'});
const inline = page.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/i);
assert.ok(inline, 'The demo builder inline script must exist');
new vm.Script(inline[1], {filename: 'website-demo-builder/index.html'});

for (const marker of [
  'id="quoteLink"',
  'id="logo"',
  'id="sitePreview"',
  'id="shareStatus"',
  'id="customerMessage"',
  'src="./share.js?v=whatsapp-request-20261020b"',
  'zf-demo-rendered',
  'html2canvas.min.js',
  'REQUEST THIS WEBSITE',
]) {
  assert.ok(page.includes(marker), 'Missing required demo element: ' + marker);
}

assert.ok(!page.includes('id="shareDownloads"'), 'No extra customer download buttons');
assert.ok(!page.includes('id="shareConsent"'), 'No extra confirmation form');
assert.ok(!page.includes('Complete any verification shown'), 'No visible FormSubmit step');
assert.ok(!page.includes('send together by email through FormSubmit'), 'No obsolete instructions');
assert.ok(page.includes('privately with ZionFlow'), 'Intake disclosure must remain visible');

for (const marker of [
  "ZIONFLOW_WHATSAPP_NUMBER = '27833110552'",
  "window.open(url, '_blank')",
  'encodeURIComponent(message())',
  'SUBMISSION_ENDPOINT',
  "form.target = frame.name",
  'multipart/form-data',
  "appendAttachment(form, 'demo_preview', files.png)",
  "appendAttachment(form, 'logo_attachment', files.logo)",
  "appendHidden(form, '_captcha', 'false')",
  "button.addEventListener('click', requestDemo)",
]) {
  assert.ok(sharing.includes(marker), 'Missing request routing or background delivery: ' + marker);
}

assert.match(sharing, /R499\/month, up-to-3-page website/, 'Keep original WhatsApp enquiry');
assert.ok(!sharing.includes('DOWNLOAD INTERACTIVE DEMO'), 'Remove extra downloads');
assert.ok(!sharing.includes('FOLLOW UP ON WHATSAPP'), 'Remove duplicate follow-up button');
assert.ok(!sharing.includes('SHARE DEMO & LOGO'), 'Remove duplicate share button');
assert.match(page, /<button[^>]*id="quoteLink"[^>]*type="button"/, 'Use native Request button');

console.log('ZionFlow custom demo preserves WhatsApp request and private asset intake: OK');
