import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('website-demo-builder/share.js', 'utf8');
const createdForms = [];
const createdFrames = [];
const openedLinks = [];
const fallbackLinks = [];
const listeners = new Map();

class DemoFile {
  constructor(parts, name, options = {}) {
    this.name = name;
    this.type = options.type || 'application/octet-stream';
    this.size = parts.reduce((total, part) =>
      total + (typeof part === 'string' ? Buffer.byteLength(part) : (part && part.size) || 0), 0);
  }
}

class DemoTransfer {
  constructor() {
    const files = [];
    this.items = {add: file => files.push(file)};
    this.files = files;
  }
}

class DemoClassList {
  constructor(active = []) { this.values = new Set(active); }
  add(item) { this.values.add(item); }
  remove(item) { this.values.delete(item); }
  contains(item) { return this.values.has(item); }
  toggle(item, on) { on ? this.add(item) : this.remove(item); }
}

function element(id, value = '') {
  return {
    id, value, checked: false, disabled: false, files: [], name: '',
    textContent: '', style: {cssText: ''},
    classList: new DemoClassList(id === 'demoWrap' ? ['show'] : []),
    children: [], listeners: {}, selectedOptions: [{textContent: value}],
    addEventListener(type, handler) { this.listeners[type] = handler; },
    setAttribute(name, value) { this[name] = value; },
    appendChild(child) { this.children.push(child); return child; },
    remove() { this.removed = true; },
    reportValidity() { return true; },
    querySelector() { return null; },
    focus() {},
  };
}

const values = {
  business: 'Pretend Bakery',
  industry: 'restaurant',
  otherIndustry: '',
  services: 'Cakes, pastries and coffee',
  location: 'Pretoria',
  phone: '012 555 0101',
  email: 'bakery@example.test',
  goal: 'enquiries',
  style: 'premium',
  primary: '#c9a227',
  customerMessage: 'Please keep the gold header on my website.'
};

const ids = Object.fromEntries(
  ['quoteLink', 'shareStatus', 'sitePreview', 'logo', 'demoForm', 'demoWrap', 'regenerate', ...Object.keys(values)]
    .map(id => [id, element(id, values[id] || '')])
);
for (const id of ['industry', 'goal', 'style']) {
  ids[id].selectedOptions = [{textContent: values[id]}];
}
ids.logo.files = [new DemoFile(['fake-logo-binary'], 'bakery-logo.png', {type: 'image/png'})];

const document = {
  body: {appendChild(child) {
    if (child.tagName === 'FORM') createdForms.push(child);
    if (child.tagName === 'IFRAME') createdFrames.push(child);
    return child;
  }},
  getElementById(id) { return ids[id]; },
  addEventListener(type, callback) { listeners.set(type, callback); },
  createElement(tag) {
    const node = element(tag);
    node.tagName = tag.toUpperCase();
    if (tag === 'form') node.submit = () => {node.submitted = true;};
    return node;
  },
};

const browser = {
  devicePixelRatio: 1,
  location: {
    origin: 'https://app.zionflow.co.za',
    pathname: '/website-demo-builder/',
    assign(url) {fallbackLinks.push(url);}
  },
  open(url, target) {
    openedLinks.push({url, target});
    return {opener: browser};
  },
  html2canvas: async () => ({
    toBlob(callback) {callback({size: 2800, type: 'image/png'});}
  }),
  setTimeout(fn, delay) {
    if (delay >= 120000) return 1; // Don't keep the test runner alive for cleanup.
    return setTimeout(fn, delay);
  }
};

const sandbox = {
  document, window: browser,
  navigator: {},
  File: DemoFile, DataTransfer: DemoTransfer,
  URL: {createObjectURL: () => 'blob:demo', revokeObjectURL() {}},
  setTimeout, console
};

vm.runInNewContext(source, sandbox, {filename: 'website-demo-builder/share.js'});
assert.equal(typeof listeners.get('zf-demo-rendered'), 'function');
listeners.get('zf-demo-rendered')();
await new Promise(resolve => setTimeout(resolve, 10));

assert.equal(ids.quoteLink.disabled, false);
assert.equal(ids.quoteLink.textContent, 'REQUEST THIS WEBSITE');
assert.equal(createdForms.length, 0, 'Files must not be sent just by generating a preview');

ids.quoteLink.listeners.click();
assert.equal(openedLinks.length, 1, 'Request must open WhatsApp in one click');
assert.equal(openedLinks[0].target, '_blank');
assert.ok(openedLinks[0].url.startsWith('https://wa.me/27833110552?text='));
assert.match(decodeURIComponent(openedLinks[0].url), /R499\/month, up-to-3-page website/);
assert.match(decodeURIComponent(openedLinks[0].url), /Business: Pretend Bakery/);
assert.match(decodeURIComponent(openedLinks[0].url), /Please keep the gold header/);
assert.equal(fallbackLinks.length, 0);

assert.equal(createdFrames.length, 1, 'Background upload must use a hidden frame');
assert.equal(createdFrames[0].getAttribute ?? null, null);
assert.equal(createdForms.length, 1, 'Background upload must create one submission');
const submission = createdForms[0];
assert.equal(submission.method, 'POST');
assert.equal(submission.enctype, 'multipart/form-data');
assert.equal(submission.action, 'https://formsubmit.co/hello@zionflow.co.za');
assert.equal(submission.target, createdFrames[0].name);
assert.notEqual(submission.target, '_blank', 'FormSubmit must not open a customer-facing tab');
assert.equal(submission.submitted, true);

const fields = Object.fromEntries(
  submission.children.filter(child => child.type === 'hidden').map(child => [child.name, child.value])
);
assert.equal(fields._captcha, 'false');
assert.equal(fields.business_name, 'Pretend Bakery');
assert.equal(fields.email, 'bakery@example.test');
assert.match(fields.message, /Cakes, pastries and coffee/);
assert.match(fields.message, /Please keep the gold header/);
assert.ok(fields.source_page.startsWith('https://app.zionflow.co.za'));

const files = submission.children.filter(child => child.type === 'file');
assert.equal(files.length, 2, 'Background submission must contain image and logo');
assert.equal(files.find(f => f.name === 'logo_attachment').files[0].name, 'bakery-logo.png');
assert.ok(files.find(f => f.name === 'demo_preview').files[0].name.endsWith('-website-demo.png'));

ids.quoteLink.listeners.click();
assert.equal(openedLinks.length, 2);
assert.equal(createdForms.length, 1, 'Repeated clicks must not double-submit attachments');

browser.html2canvas = async () => {throw new Error('Simulated screenshot failure');};
listeners.get('zf-demo-rendered')();
await new Promise(resolve => setTimeout(resolve, 10));
assert.equal(ids.quoteLink.disabled, false, 'WhatsApp request must work when optional image preparation fails');
ids.quoteLink.listeners.click();
assert.equal(openedLinks.length, 3);
assert.equal(createdForms.length, 1, 'A broken screenshot must never be replaced by the wrong file');
assert.match(ids.shareStatus.textContent, /could not automatically save your preview image/i);

console.log('WhatsApp request, hidden attachment submission, duplicate safety and fallback: OK');
