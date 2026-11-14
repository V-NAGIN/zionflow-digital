import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync('website-demo-builder/experience.js','utf8');
const css = fs.readFileSync('website-demo-builder/customize.css','utf8');
const page = fs.readFileSync('website-demo-builder/index.html','utf8');
const sandbox = {window:{},document:{addEventListener() {}}, console};
vm.runInNewContext(script,sandbox,{filename:'experience.js'});
const plan = sandbox.window.ZionFlowDemoExperience.buildPlan;
assert.equal(typeof plan,'function');

const baseline = plan({
  industry:'local', goal:'enquiries', style:'premium',name:'Sample Plumbing',
  services:'Pipe repairs, Geyser replacements, Leak tracing',location:'Johannesburg'
});
assert.equal(baseline.services.length,3);
assert.equal(baseline.faqs.length,0);
assert.equal(baseline.headingFont,'modern');
assert.equal(baseline.imageMood,'natural');
assert.equal(baseline.primaryAction,'Get a Quote');

const tailored = plan({
  industry:'professional',goal:'enquiries',style:'modern',name:'Sample Consultancy',
  services:'Business plans, Financial forecasts, Consultations',location:'Pretoria',
  customHeadline:'Practical advice for growing businesses.',
  customSubheading:'Work with a team that understands your goals.',
  aboutStory:'We help local founders plan for sustainable growth.',
  serviceDetails:'Strategy Workshops | Structured planning sessions for founders.\nForecasting | Clear projections for your next decision.\nClient Onboarding | Practical processes for your team.',
  whyChoose:'Clear communication\nPractical recommendations\nLocal experience',
  faqDetails:'Do you offer an initial meeting? | Please contact us to discuss.\nCan we meet online? | Ask us about available options.',
  targetAudience:'Independent founders and small teams',
  businessHours:'Weekdays, by appointment',
  buttonText:'Discuss Your Project',
  headingFont:'editorial',imageMood:'rich',email:'hello@example.test'
});
assert.equal(tailored.headline,'Practical advice for growing businesses.');
assert.equal(tailored.copy,'Work with a team that understands your goals.');
assert.equal(tailored.about,'We help local founders plan for sustainable growth.');
assert.equal(tailored.primaryAction,'Discuss Your Project');
assert.equal(tailored.serviceDescriptions[0],'Structured planning sessions for founders.');
assert.equal(tailored.services[0],'Strategy Workshops');
assert.equal(tailored.services[1],'Forecasting');
assert.equal(tailored.services[2],'Client Onboarding');
assert.equal(tailored.trust[0],'Clear communication');
assert.equal(tailored.trust[2],'Local experience');
assert.equal(tailored.faqs.length,2);
assert.equal(tailored.faqs[0].question,'Do you offer an initial meeting?');
assert.equal(tailored.faqs[1].answer,'Ask us about available options.');
assert.ok(tailored.goalFeatureCopy.includes('Independent founders and small teams'));
assert.equal(tailored.email,'hello@example.test');
assert.equal(tailored.businessHours,'Weekdays, by appointment');
assert.equal(tailored.headingFont,'editorial');
assert.equal(tailored.imageMood,'rich');
const customPhoto = plan({industry:'local', uploadedPhoto:'blob:https://app.zionflow.co.za/12345-demo'});
assert.equal(customPhoto.photo,'blob:https://app.zionflow.co.za/12345-demo');
const rejectedPhoto = plan({industry:'local', uploadedPhoto:'javascript:alert(1)'});
assert.notEqual(rejectedPhoto.photo,'javascript:alert(1)');


const fallback = plan({
  industry:'other', goal:'sales', style:'minimal',
  services:'Custom goods, Craftwork',
  serviceDetails:'Extra detail without a service separator',
  faqDetails:'Unformatted question without an answer',
  headingFont:'bad-input',imageMood:'bad-input'
});
assert.equal(fallback.services[0],'Custom goods');
assert.equal(fallback.serviceDescriptions[0],'Extra detail without a service separator');
assert.equal(fallback.faqs.length,0);
assert.equal(fallback.headingFont,'modern');
assert.equal(fallback.imageMood,'natural');

for(const field of ['customHeadline','customSubheading','aboutStory','serviceDetails',
  'whyChoose','faqDetails','targetAudience','businessHours','buttonText','headingFont','imageMood']){
 assert.ok(page.includes('id="'+field+'"'), 'Missing input: '+field);
}
for(const fragment of ['.zf-contact-section','.zf-faq-section','.service p',
  '.type-editorial','.image-rich','.image-soft']){
 assert.ok(css.includes(fragment),'Missing custom preview style: '+fragment);
}
assert.ok(script.includes("function drawContact(plan)"));
assert.ok(script.includes("function drawFaq(plan)"));
assert.ok(script.includes("escapeHtml(item.question)"), 'FAQ text must be encoded before HTML insertion');
assert.ok(script.includes("escapeHtml(item.value)"), 'Contact details must be encoded before HTML insertion');

console.log('Rich customer content, descriptions, trust points, FAQs and visual choices: OK');
