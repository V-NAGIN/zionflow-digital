import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('website-demo-builder/index.html', 'utf8');
const script = fs.readFileSync('website-demo-builder/experience.js', 'utf8');
const css = fs.readFileSync('website-demo-builder/experience.css', 'utf8');

const events = new Map();
const browser = {};
const sandbox = {
  window: browser,
  document: {
    addEventListener(name, callback) { events.set(name, callback); }
  },
  console
};

new vm.Script(script, { filename: 'experience.js' });
vm.runInNewContext(script, sandbox, { filename: 'experience.js' });

assert.equal(typeof browser.ZionFlowDemoExperience?.buildPlan, 'function', 'Experience planning engine should load');
assert.equal(typeof events.get('zf-demo-rendered'), 'function', 'Experience must render on preview event');
assert.equal(typeof events.get('change'), 'function', 'Dropdown changes must trigger immediate updates');

const plan = browser.ZionFlowDemoExperience.buildPlan;
const industries = ['local','beauty','restaurant','professional','construction','automotive','education','accommodation','retail','other'];
const goals = ['enquiries','bookings','sales','showcase'];
const styles = ['premium','modern','bold','minimal'];
const outputSignatures = new Set();

for (const industry of industries) {
  for (const goal of goals) {
    for (const style of styles) {
      const result = plan({
        industry, goal, style, name: 'Sample Business',
        services: 'Consultations, Customer Care, Services',
        location: 'Johannesburg', primary: '#456abc'
      });
      assert.equal(result.industry, industry);
      assert.equal(result.goal, goal);
      assert.equal(result.style, style);
      assert.equal(result.services.length, 3);
      assert.ok(result.headline.length > 12);
      assert.ok(result.goalFeatureTitle.length > 12);
      assert.ok(result.primaryAction.length > 4);
      assert.equal(result.nav.length, 4);
      assert.ok(result.composition.length);
      assert.equal(result.primary, '#456abc');

      const fingerprint = [
        result.industryLabel, result.headline, result.kicker, result.category,
        result.goalFeatureTitle, result.servicesHeading, result.primaryAction,
        result.composition, result.nav.join('|')
      ].join('/');
      assert.ok(!outputSignatures.has(fingerprint), 'Combination has duplicate design plan: ' + industry + '/' + goal + '/' + style);
      outputSignatures.add(fingerprint);
    }
  }
}
assert.equal(outputSignatures.size, 160, 'All 160 combinations should produce unique plans');

// One selection at a time must affect more than a generic button label or background.
const baseline = {industry:'local',goal:'enquiries',style:'premium',name:'Example Co',services:'Emergency repair'};
const base = plan(baseline);
const industryChanged = plan({...baseline, industry:'restaurant'});
assert.notEqual(industryChanged.headline, base.headline);
assert.notEqual(industryChanged.kicker, base.kicker);
assert.notEqual(industryChanged.category, base.category);
assert.notEqual(industryChanged.serviceDetail, base.serviceDetail);

const goalChanged = plan({...baseline, goal:'showcase'});
assert.notEqual(goalChanged.headline, base.headline);
assert.notEqual(goalChanged.goalFeatureTitle, base.goalFeatureTitle);
assert.notEqual(goalChanged.servicesHeading, base.servicesHeading);
assert.notEqual(goalChanged.primaryAction, base.primaryAction);
assert.notDeepEqual(goalChanged.nav, base.nav);

const styleChanged = plan({...baseline, style:'bold'});
assert.notEqual(styleChanged.composition, base.composition);
assert.notEqual(styleChanged.styleName, base.styleName);

for (const style of styles) {
  assert.ok(css.includes('.style-' + style), 'Missing complete visual system ' + style);
}
for (const industry of industries) {
  assert.ok(css.includes('.industry-' + industry), 'Missing industry-specific art direction ' + industry);
}
for (const goal of goals) {
  assert.ok(css.includes('.goal-' + goal), 'Missing goal-specific information architecture ' + goal);
}

assert.ok(css.includes('@media(max-width:620px)'), 'Mobile layout must be implemented');
assert.ok(css.includes('grid-template-columns'), 'Preview design must use responsive compositions');
assert.ok(html.includes('experience.css?v=adaptive-20261021a'), 'Browser must load the new CSS');
assert.ok(html.includes('experience.js?v=adaptive-20261021a'), 'Browser must load the new personalisation engine');
assert.ok(html.indexOf('experience.js?v=adaptive-20261021a') < html.indexOf('share.js?v=whatsapp-request-20261020b'), 'Personalization must run before screenshot capture');

// Existing customer interaction is deliberately unchanged.
for (const marker of ['id="demoForm"', 'id="logo"', 'id="industry"', 'id="goal"', 'id="style"',
                      'id="quoteLink"', 'id="regenerate"', 'id="sitePreview"', 'REQUEST THIS WEBSITE']) {
  assert.ok(html.includes(marker), 'Existing customer control missing: ' + marker);
}

const guestPlan = plan({...baseline,industry:'accommodation',goal:'bookings'});
assert.equal(guestPlan.primaryAction, 'Enquire About Dates', 'Accommodation should have relevant booking copy');
const restaurantPlan = plan({...baseline,industry:'restaurant',goal:'bookings'});
assert.equal(restaurantPlan.primaryAction, 'Reserve a Table', 'Restaurants should not share a generic booking CTA');
const customPlan = plan({...baseline,industry:'other',otherIndustry:'Pet Care'});
assert.equal(customPlan.industryLabel, 'Pet Care', 'Other industry should personalize the preview');

console.log('160 distinct industry × goal × style plans, mobile styles and request preservation: OK');
