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


assert.equal(ids.quoteLink.disabled, false, 'The request should be enabled only after the preview screenshot exists');
assert.equal(ids.quoteLink.textContent, 'REQUEST THIS WEBSITE');

ids.quoteLink.listeners.click();
assert.equal(createdForms.length, 0, 'Request must require explicit file-sharing consent');

ids.shareConsent.checked = true;
ids.quoteLink.listeners.click();

assert.equal(createdForms.length, 1, 'Main request must create one submission with preview and logo');
const submission = createdForms[0];
assert.equal(submission.submitted, true);
assert.equal(submission.method, 'POST');
assert.equal(submission.enctype, 'multipart/form-data');
assert.equal(submission.action, 'https://formsubmit.co/hello@zionflow.co.za');
assert.equal(submission.target, '_blank');

const fields = Object.fromEntries(
  submission.children.filter(item => item.type === 'hidden').map(item => [item.name, item.value])
);
assert.equal(fields.business_name, 'Pretend Bakery');
assert.equal(fields.email, 'bakery@example.test');
assert.match(fields.message, /Cakes, pastries and coffee/);
assert.match(fields.message, /Please keep the gold header/);
assert.match(fields.attachments, /preview screenshot.*customer logo image/i);

const fileFields = submission.children.filter(item => item.type === 'file');
assert.equal(fileFields.length, 2, 'Every uploaded logo must be included alongside the screenshot');
assert.equal(fileFields.find(item => item.name === 'logo_attachment').files[0].name, 'bakery-logo.png');
assert.match(fileFields.find(item => item.name === 'demo_preview').files[0].name, /website-demo\\.png$/);

assert.equal(openedLinks.length, 0, 'The main request must not open text-only WhatsApp');
assert.equal(fallbackLinks.length, 0, 'The main request must not redirect to a text-only WhatsApp link');
const whatsappFollowUp = ids.shareDownloads.children.find(item => item.textContent === 'FOLLOW UP ON WHATSAPP');
assert.ok(whatsappFollowUp, 'WhatsApp follow-up remains available after the attached request starts');
assert.match(whatsappFollowUp.href, /^https:\\/\\/wa\\.me\\/27833110552\\?text=/);

browser.html2canvas = async () => { throw new Error('Simulated screenshot failure'); };
listeners.get('zf-demo-rendered')();
await new Promise(resolve => setTimeout(resolve, 10));
assert.equal(ids.quoteLink.disabled, true, 'Never accept a screenshot-free request');
assert.match(ids.shareStatus.textContent, /Could not prepare your exact website image/i);

console.log('Primary website request requires consent, logo + screenshot attachments, and blocks missing previews: OK');
