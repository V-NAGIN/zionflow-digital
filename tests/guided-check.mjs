import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('website-demo-builder/index.html','utf8');
const guided = fs.readFileSync('website-demo-builder/guided.js','utf8');
const css = fs.readFileSync('website-demo-builder/guided.css','utf8');
const request = fs.readFileSync('website-demo-builder/share.js','utf8');

new vm.Script(guided,{filename:'guided.js'});
for(const id of ['zfAssistHeader','zfAssistForm','zfAssistPreview','zfEssentialsStatus',
                 'business','industry','services','demoForm']) {
  assert.ok(html.includes('id="'+id+'"'), 'Missing guided UI control: '+id);
}
for(const marker of ["'business','industry','services'","'customHeadline'","'faqDetails'",
                     "aria-expanded","zfAdvancedToggle","ZionFlowWebsiteAssistance"]) {
  assert.ok(guided.includes(marker),'Missing guided interaction: '+marker);
}
assert.ok(css.includes('.zf-easy-advanced-field[hidden]'), 'Advanced options must stay hidden when collapsed');
assert.ok(css.includes('@media(max-width:700px)'), 'Mobile first guided content must be responsive');
assert.ok(html.includes('guided.js?v=easier-20261114a'), 'Guided JS must be loaded');
assert.ok(html.includes('guided.css?v=easier-20261114a'), 'Guided CSS must be loaded');
assert.ok(html.includes('No payment is taken.'), 'Customer request disclosure must remain present');
assert.ok(request.includes('window.ZionFlowWebsiteAssistance = Object.freeze({open:requestAssistance})'),
  'Assistance must reach existing WhatsApp number through request module');
assert.ok(request.includes('ZIONFLOW_WHATSAPP_NUMBER = \'27833110552\''), 'Existing WhatsApp destination unchanged');
assert.ok(request.includes("button.addEventListener('click', requestDemo)"), 'Original website request preserved');
assert.ok(request.includes("appendAttachment(form, 'demo_preview', files.png)"), 'Private preview intake preserved');
assert.ok(request.includes("appendAttachment(form, 'logo_attachment', files.logo)"), 'Private logo intake preserved');
console.log('Easy guided builder, progressive disclosure and assisted WhatsApp route: OK');
