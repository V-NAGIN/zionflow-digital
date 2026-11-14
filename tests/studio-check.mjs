import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('website-demo-builder/index.html', 'utf8');
const js = fs.readFileSync('website-demo-builder/studio.js', 'utf8');
const css = fs.readFileSync('website-demo-builder/studio.css', 'utf8');
const sharing = fs.readFileSync('website-demo-builder/share.js', 'utf8');

new vm.Script(js, {filename: 'studio.js'});

assert.ok(html.includes('studio.css?v=premium-20261114a'), 'Premium studio stylesheet should load');
assert.ok(html.includes('studio.js?v=premium-20261114-rich-20261114'), 'Premium controls should load');
assert.ok(html.indexOf('experience.js?v=adaptive-20261021a') < html.indexOf('studio.js?v=premium-20261114-rich-20261114'), 'Studio must enhance the original experience');
assert.ok(html.indexOf('studio.js?v=premium-20261114-rich-20261114') < html.lastIndexOf('<script>'), 'Original inline form renderer remains last');
for (const field of ['demoForm', 'business', 'industry', 'services', 'goal', 'logo', 'style', 'primary', 'demoWrap', 'sitePreview', 'quoteLink']) {
  assert.ok(html.includes('id="' + field + '"'), 'Required customer field missing: ' + field);
}
for (const feature of [
  'zf-preview-mobile', 'zf-preview-expanded', "aria-pressed", "aria-label",
  "addSection('business'", "addSection('logo'", "styleSelect.dispatchEvent",
  "document.getElementById('business')"
]) assert.ok(js.includes(feature), 'Studio feature missing: ' + feature);

assert.ok(css.includes('.zf-style-swatch {'), 'Default premium style card must be defined');
for (const style of ['modern','bold','minimal']) {
  assert.ok(css.includes('.zf-style-swatch-' + style), 'Template card style missing: ' + style);
}
assert.ok(css.includes('.zf-preview-mobile .site.zf-experience .zf-hero-layout'), 'Mobile hero must reflow on desktop');
assert.ok(css.includes('.zf-preview-mobile .site.zf-experience .services'), 'Mobile service cards must reflow');
assert.ok(css.includes('prefers-reduced-motion'), 'Respect reduced-motion settings');
assert.ok(sharing.includes("ZIONFLOW_WHATSAPP_NUMBER = '27833110552'"), 'WhatsApp customer route must remain unchanged');
assert.ok(sharing.includes("appendAttachment(form, 'logo_attachment', files.logo)"), 'Logo intake must remain unchanged');
assert.ok(sharing.includes("appendAttachment(form, 'demo_preview', files.png)"), 'Preview intake must remain unchanged');

console.log('Premium studio UI wiring, 4 style cards, mobile preview and unchanged request route: OK');
