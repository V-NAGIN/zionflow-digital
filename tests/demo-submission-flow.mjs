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
    querySelectorAll() { return []; },
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
  customerMessage: 'Please keep the gold header on my website.',
  customHeadline: 'Fresh pastries, thoughtfully baked.',
  customSubheading: 'Local bakery with coffee and takeaway favourites.',
  aboutStory: 'Family-owned since 2020.',
  serviceDetails: 'Custom Cakes | Orders for special celebrations',
  whyChoose: 'Small batches; Friendly service',
  faqDetails: 'Can I order ahead? | Contact us to discuss.',
  targetAudience: 'Local families and offices',
  businessHours: 'Mon–Sat 7am–4pm',
  buttonText: 'Ask About Orders',
  headingFont: 'editorial',
  imageMood: 'soft'
};

const ids = Object.fromEntries(
  ['quoteLink', 'shareStatus', 'sitePreview', 'logo', 'heroPhoto', 'demoForm', 'demoWrap', 'regenerate', ...Object.keys(values)]
    .map(id => [id, element(id, values[id] || '')])
);
for (const id of ['industry', 'goal', 'style']) {
  ids[id].selectedOptions = [{textContent: values[id]}];
}
ids.logo.files = [new DemoFile(['fake-logo-binary'], 'bakery-logo.png', {type: 'image/png'})];
ids.heroPhoto.files = [new DemoFile(['fake-photo-binary'], 'bakery-photo.png', {type: 'image/png'})];

ids.demoIndustry = element('demoIndustry');
ids.demoIndustry.textContent = 'Food & Restaurant · Premium & professional';
ids.heroTitle = element('heroTitle');
ids.heroTitle.textContent = 'Great food deserves a great first impression.';
ids.heroPrimary = element('heroPrimary');
ids.heroPrimary.textContent = 'Get a Quote';
ids.sitePreview.innerText = 'Pretend Bakery\nFresh pastries, thoughtfully baked.\nCustom Cakes\nCan I order ahead?';


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
assert.equal(typeof browser.ZionFlowWebsiteAssistance?.open, 'function', 'Assistance path should exist');
browser.ZionFlowWebsiteAssistance.open();
assert.equal(openedLinks.length, 1, 'Help must open the existing ZionFlow WhatsApp number');
assert.ok(openedLinks[0].url.startsWith('https://wa.me/27833110552?text='));
const help = new URL(openedLinks[0].url).searchParams.get('text');
assert.match(help, /help creating a website/i);
assert.match(help, /Pretend Bakery/);
assert.match(help, /Cakes, pastries and coffee/);
assert.ok(!help.includes('R499/month'), 'Help should not create an order enquiry');
assert.equal(createdForms.length, 0, 'Help must not auto-send the screenshot, logo or photo');
openedLinks.length = 0;
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
for (const part of [
  'Fresh pastries, thoughtfully baked.',
  'Local bakery with coffee and takeaway favourites.',
  'Family-owned since 2020.',
  'Custom Cakes | Orders for special celebrations',
  'Small batches; Friendly service',
  'Can I order ahead? | Contact us to discuss.',
  'Local families and offices',
  'Mon–Sat 7am–4pm',
  'Ask About Orders',
  'Heading typography: editorial',
  'Photography style: soft',
  'Business photo uploaded: Yes (bakery-photo.png)'
]) assert.ok(new URL(openedLinks[0].url).searchParams.get('text').includes(part), 'Customer detail missing from WhatsApp: ' + part);

const whatsappText = new URL(openedLinks[0].url).searchParams.get('text');
for (const detail of [
  '*WEBSITE REQUEST — CUSTOMER DETAILS*',
  'Business: Pretend Bakery',
  'Industry: restaurant',
  'Services: Cakes, pastries and coffee',
  'Location: Pretoria',
  'Phone / WhatsApp: 012 555 0101',
  'Email: bakery@example.test',
  'Goal: enquiries',
  'Style: premium',
  'Brand colour: #c9a227',
  'Logo uploaded: Yes (bakery-logo.png)',
  'Preview: Food & Restaurant · Premium & professional',
  'Website headline: Great food deserves a great first impression.',
  'Website button: Get a Quote',
  'Please keep the gold header on my website.'
]) assert.ok(whatsappText.includes(detail), 'WhatsApp brief is missing: ' + detail);
assert.ok(!whatsappText.includes('undefined'), 'WhatsApp must not contain undefined details');

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
assert.equal(files.length, 4, 'Background submission must contain brief, preview, logo and business photo');
assert.equal(files.find(f => f.name === 'logo_attachment').files[0].name, 'bakery-logo.png');
assert.ok(files.find(f => f.name === 'demo_preview').files[0].name.endsWith('-website-demo.png'));
assert.equal(files.find(f => f.name === 'business_photo').files[0].name,'bakery-photo.png');
assert.equal(files.find(f => f.name === 'website_brief').files[0].type,'text/plain');
assert.ok(/^ZF-WEB-/.test(fields.request_reference), 'Both channels must have a stable case reference');
assert.equal(fields.request_type, 'Request this website');
assert.ok(fields.complete_website_brief.includes('Frequently asked questions: Can I order ahead?'), 'Full customer content must be included');
assert.ok(fields.complete_website_brief.includes('FULL GENERATED WEBSITE PREVIEW TEXT'), 'Rendered preview must be described');
assert.ok(fields.generated_website_preview_text.includes('Custom Cakes'), 'Preview text must be saved');
assert.ok(whatsappText.includes(fields.request_reference), 'Reference must match WhatsApp and private submission');

ids.quoteLink.listeners.click();
assert.equal(openedLinks.length, 2);
assert.equal(createdForms.length, 1, 'Repeated clicks must not double-submit attachments');

// Assistance AFTER a preview is generated must privately archive the whole
// brief, sharing the same reference as the first WhatsApp request.
browser.ZionFlowWebsiteAssistance.open();
assert.equal(openedLinks.length, 3);
assert.equal(createdForms.length, 2, 'Help after preview must separately archive the concept');
const helpFields = Object.fromEntries(createdForms[1].children.filter(child => child.type === 'hidden').map(child => [child.name, child.value]));
assert.equal(helpFields.request_type, 'Help finishing custom demo');
assert.equal(helpFields.request_reference, fields.request_reference);
assert.ok(helpFields.complete_website_brief.includes('Please help me plan and finish this website.'));

// A later update to the customer's notes must not be silently lost.
ids.customerMessage.value = 'Please add an online ordering section as well.';
ids.quoteLink.listeners.click();
assert.equal(createdForms.length, 3, 'Updated requirements must produce a revised intake');
const revisedFields = Object.fromEntries(createdForms[2].children.filter(child => child.type === 'hidden').map(child => [child.name, child.value]));
assert.ok(revisedFields.complete_website_brief.includes('online ordering section'));
assert.equal(revisedFields.request_type, 'Request this website');

browser.html2canvas = async () => {throw new Error('Simulated screenshot failure');};
listeners.get('zf-demo-rendered')();
await new Promise(resolve => setTimeout(resolve, 10));
assert.equal(ids.quoteLink.disabled, false, 'WhatsApp request must work when optional image preparation fails');
ids.quoteLink.listeners.click();
assert.equal(openedLinks.length, 5);
assert.equal(createdForms.length, 4, 'Even with a broken screenshot the complete brief must still be submitted');
const fallback = createdForms[3];
const fallbackFields = Object.fromEntries(fallback.children.filter(child => child.type === 'hidden').map(child => [child.name, child.value]));
assert.equal(fallbackFields.request_reference, fields.request_reference);
assert.equal(fallbackFields.preview_image_file, 'Screenshot unavailable');
assert.ok(fallbackFields.complete_website_brief.includes('Pretend Bakery'));
assert.ok(fallbackFields.generated_website_preview_text.includes('Custom Cakes'));
const fallbackFiles = fallback.children.filter(child => child.type === 'file');
assert.ok(!fallbackFiles.some(child => child.name === 'demo_preview'), 'Failed screenshot must not be replaced by a bogus image');
assert.ok(fallbackFiles.some(child => child.name === 'website_brief'), 'Text attachment must survive capture failure');
assert.match(ids.shareStatus.textContent, /preview image|missing images/i);

// Campaign visitors should receive the advertised, conditional Black Friday
// enquiry message, not the standard R499 offer. Attribution travels in both
// WhatsApp and the private email handoff.
browser.location.search = '?utm_source=facebook&utm_medium=paid_social&utm_campaign=zf_black_friday_349_nov2026';
ids.quoteLink.listeners.click();
assert.equal(openedLinks.length, 6);
assert.equal(createdForms.length, 5, 'Campaign source should update the archived brief');
const taggedText = new URL(openedLinks[5].url).searchParams.get('text');
assert.match(taggedText, /Black Friday 3-page website offer at R349\/month/);
assert.match(taggedText, /confirm the promotional subscription terms/);
assert.ok(!taggedText.includes('discuss the R499/month'), 'Do not present standard rate to campaign visitors');
assert.match(taggedText, /Lead source: facebook/);
assert.match(taggedText, /Campaign: zf_black_friday_349_nov2026/);
const taggedFields = Object.fromEntries(createdForms[4].children.filter(child => child.type === 'hidden').map(child => [child.name, child.value]));
assert.equal(taggedFields.utm_campaign, 'zf_black_friday_349_nov2026');
assert.equal(taggedFields.utm_source, 'facebook');
assert.equal(taggedFields.utm_medium, 'paid_social');
assert.equal(taggedFields.request_reference, fields.request_reference);

browser.ZionFlowWebsiteAssistance.open();
const taggedHelpText = new URL(openedLinks.at(-1).url).searchParams.get('text');
assert.match(taggedHelpText, /Campaign: zf_black_friday_349_nov2026/);
assert.match(taggedHelpText, /Lead source: facebook/);

console.log('WhatsApp request, hidden attachment submission, duplicate safety and fallback: OK');
