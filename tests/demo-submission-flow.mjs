import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('website-demo-builder/share.js', 'utf8');
const createdForms = [];
const openedLinks = [];
const fallbackLinks = [];
const listeners = new Map();

class DemoFile {
  constructor(parts, name, options = {}) {
    this.name = name;
    this.type = options.type || 'application/octet-stream';
    this.size = parts.reduce((total, chunk) => {
      return total + (typeof chunk === 'string' ? Buffer.byteLength(chunk) : (chunk && chunk.size) || 0);
    }, 0);
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
  toggle(item, condition) { condition ? this.add(item) : this.remove(item); }
}

function element(id, value = '') {
  return {
    id, value,
    files: [],
    disabled: false,
    checked: false,
    classList: new DemoClassList(id === 'demoWrap' ? ['show'] : []),
    listeners: {},
    children: [],
    selectedOptions: [{textContent: value}],
    addEventListener(name, listener) { this.listeners[name] = listener; },
    setAttribute(name, value) { this[name] = value; },
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren() { this.children = []; },
    focus() {},
    reportValidity() { return true; },
    querySelector() { return null; },
    cloneNode() {
      return {
        outerHTML: '<div id="sitePreview">Approved mock design</div>',
        querySelectorAll() { return []; }
      };
    }
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
  [
    'quoteLink','shareStatus','shareDownloads','sitePreview','logo',
    'demoForm','demoWrap','shareConsent', ...Object.keys(values)
  ].map(id => [id, element(id, values[id] || '')])
);

for (const id of ['industry', 'goal', 'style']) {
  ids[id].selectedOptions = [{textContent: values[id]}];
}
ids.logo.files = [new DemoFile(['fake-logo-binary'], 'bakery-logo.png', {type: 'image/png'})];

const document = {
  body: {appendChild(child) { createdForms.push(child); return child; }},
  getElementById(id) { return ids[id]; },
  querySelector(selector) {
    if (selector === 'head style') return {textContent: '.site{color:#000}'};
    return null;
  },
  createElement(tag) {
    const node = element(tag);
    node.tagName = tag.toUpperCase();
    node.remove = () => {};
    if (tag === 'form') node.submit = () => {node.submitted = true;};
    return node;
  },
  addEventListener(name, handler) { listeners.set(name, handler); }
};

const browser = {
  location: {
    origin: 'https://app.zionflow.co.za',
    pathname: '/website-demo-builder/',
    assign(url) { fallbackLinks.push(url); }
  },
  open(url, target) {
    openedLinks.push({url, target});
    return {opener: browser};
  },
  devicePixelRatio: 1,
  html2canvas: async () => ({
    toBlob(callback) {
      callback({size: 2800, type: 'image/png'});
    }
  }),
  setTimeout
};

class DemoFileReader {
  readAsDataURL() {
    this.result = 'data:image/png;base64,bW9jay1sb2dv';
    queueMicrotask(() => this.onload());
  }
}

const sandbox = {
  document,
  window: browser,
  navigator: {},
  File: DemoFile,
  FileReader: DemoFileReader,
  DataTransfer: DemoTransfer,
  URL: {
    createObjectURL: () => 'blob:mock-website-demo',
    revokeObjectURL() {}
  },
  setTimeout,
  console
};

vm.runInNewContext(source, sandbox, {filename: 'website-demo-builder/share.js'});
assert.equal(typeof listeners.get('zf-demo-rendered'), 'function', 'Must prepare attachments after preview render');

listeners.get('zf-demo-rendered')();
await new Promise(resolve => setTimeout(resolve, 10));

assert.equal(ids.quoteLink.disabled, false, 'WhatsApp request must be enabled');

ids.quoteLink.listeners.click();
assert.equal(openedLinks.length, 1, 'Request must immediately open WhatsApp');
assert.equal(openedLinks[0].target, '_blank');
assert.match(openedLinks[0].url, /^https:\/\/wa\.me\/27833110552\?text=/);
const whatsappText = new URL(openedLinks[0].url).searchParams.get('text');
assert.match(whatsappText, /Pretend Bakery/);
assert.match(whatsappText, /Cakes, pastries and coffee/);
assert.match(whatsappText, /Please keep the gold header/);
assert.equal(createdForms.length, 0, 'Request must not transmit files via email');

const emailButton = ids.shareDownloads.children.find(
  item => item.textContent === 'EMAIL DEMO & LOGO'
);
assert.ok(emailButton, 'Email attachment option must remain available');
emailButton.listeners.click();
assert.equal(createdForms.length, 0, 'Email attachments require explicit consent');
ids.shareConsent.checked = true;
emailButton.listeners.click();

assert.equal(createdForms.length, 1, 'Email option should create one submission');
const submission = createdForms[0];
assert.equal(submission.submitted, true);
assert.equal(submission.method, 'POST');
assert.equal(submission.enctype, 'multipart/form-data');
assert.equal(submission.action, 'https://formsubmit.co/hello@zionflow.co.za');
const fields = Object.fromEntries(
  submission.children.filter(item => item.type === 'hidden').map(item => [item.name, item.value])
);
assert.equal(fields.business_name, 'Pretend Bakery');
assert.equal(fields.email, 'bakery@example.test');
assert.match(fields.message, /Cakes, pastries and coffee/);
assert.match(fields.message, /Please keep the gold header/);
const fileFields = submission.children.filter(item => item.type === 'file');
assert.equal(fileFields.length, 2);
assert.equal(fileFields.find(item => item.name === 'logo_attachment').files[0].name, 'bakery-logo.png');
assert.match(fileFields.find(item => item.name === 'demo_preview').files[0].name, /website-demo\.png$/);

browser.open = () => null;
ids.quoteLink.listeners.click();
assert.equal(fallbackLinks.length, 1, 'Blocked popup should use same-tab fallback');
assert.match(fallbackLinks[0], /^https:\/\/wa\.me\/27833110552\?text=/);

console.log('WhatsApp Request redirect and optional email attachments: OK');
