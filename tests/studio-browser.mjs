import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { mkdir, access } from 'node:fs/promises';

const paths = ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
let executablePath = '';
for (const p of paths) { try { await access(p); executablePath = p; break; } catch {} }
if (!executablePath) throw new Error('Chromium is required for premium studio review');

const url = process.env.STUDIO_URL || 'http://127.0.0.1:8765/website-demo-builder/';
await mkdir('artifacts', {recursive: true});
const browser = await chromium.launch({headless:true, executablePath, args:['--no-sandbox','--disable-dev-shm-usage']});

async function fill(page) {
  await page.goto(url, {waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#business').fill('Example Beauty Studio');
  await page.locator('#industry').selectOption('beauty');
  await page.locator('#services').fill('Hair styling, Skin treatments, Bridal makeup');
  await page.locator('#location').fill('Johannesburg');
  await page.locator('#goal').selectOption('bookings');
}

try {
  const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(url, {waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(await page.locator('#zfAssistHeader').isVisible(), 'Help should be available before any input');
  assert.ok(await page.locator('#customHeadline').isHidden(), 'Advanced fields should be collapsed at first');
  assert.equal(await page.locator('#zfAdvancedToggle').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#zfEssentialsStatus').textContent(),'0 of 3 essentials ready');

  await page.evaluate(() => {
    window.__zfAssistOpened = [];
    window.open = (url, target) => {
      window.__zfAssistOpened.push({url,target});
      return {opener:null};
    };
  });
  await page.locator('#zfAssistHeader').click();
  const blankHelp = await page.evaluate(() => window.__zfAssistOpened);
  assert.equal(blankHelp.length,1);
  assert.ok(blankHelp[0].url.startsWith('https://wa.me/27833110552?text='), 'Help must reach ZionFlow WhatsApp');
  assert.ok(new URL(blankHelp[0].url).searchParams.get('text').includes('help creating a website'));
  assert.ok(!new URL(blankHelp[0].url).searchParams.get('text').includes('R499/month'), 'Help should not assume an order');
  assert.ok(!new URL(blankHelp[0].url).searchParams.get('text').includes('Choose your industry'), 'Help should not treat placeholder as customer input');
  assert.equal(await page.locator('#demoWrap.show').count(),0,'Asking for help does not require a preview');

  await fill(page);
  await page.evaluate(() => {
    window.__zfAssistOpened = [];
    window.open = (url, target) => {
      window.__zfAssistOpened.push({url,target});
      return {opener:null};
    };
  });
  assert.equal(await page.locator('#zfEssentialsStatus').textContent(),'Ready to preview');
  await page.locator('#zfAssistForm').click();
  const filledHelp = await page.evaluate(() => window.__zfAssistOpened);
  assert.equal(filledHelp.length,1);
  const filledText = new URL(filledHelp[0].url).searchParams.get('text');
  assert.ok(filledText.includes('Example Beauty Studio'));
  assert.ok(filledText.includes('Hair styling, Skin treatments, Bridal makeup'));

  await page.locator('#zfAdvancedToggle').click();
  assert.equal(await page.locator('#zfAdvancedToggle').getAttribute('aria-expanded'),'true');
  assert.ok(await page.locator('#customHeadline').isVisible());
  await page.locator('#customHeadline').fill('Thoughtful beauty for every occasion.');
  await page.locator('#customSubheading').fill('A welcoming studio offering hair, skin and bridal services.');
  await page.locator('#aboutStory').fill('Our independent studio helps people feel confident and cared for.');
  await page.locator('#serviceDetails').fill(
    'Hair Styling | Individual cuts and styling consultations.\n' +
    'Skin Treatments | Personalised facial treatments.\n' +
    'Bridal Makeup | Occasion-ready artistry.'
  );
  await page.locator('#whyChoose').fill('Personal attention\nThoughtful consultations\nA calm atmosphere');
  await page.locator('#faqDetails').fill('Do you take bookings? | Please contact our team to enquire.\nWhere are you located? | Johannesburg.');
  await page.locator('#targetAudience').fill('Local clients and bridal parties');
  await page.locator('#businessHours').fill('Tue–Sat, by appointment');
  await page.locator('#buttonText').fill('Request an Appointment');
  await page.locator('#headingFont').selectOption('editorial');
  await page.locator('#imageMood').selectOption('soft');
  // Reuse the repository's real sample image for a meaningful visual QA screenshot.
  await page.locator('#heroPhoto').setInputFiles('beauty-demo/hero-800.webp');


  const modern = page.locator('[data-style-choice="modern"]');
  await modern.click();
  assert.equal(await page.locator('#style').inputValue(), 'modern');
  assert.equal(await modern.getAttribute('aria-pressed'),'true');

  await page.locator('#demoForm button[type="submit"]').click();
  await page.locator('#demoWrap.show').waitFor();
  await page.locator('#zfAssistPreview').click();
  const previewHelp = await page.evaluate(() => window.__zfAssistOpened);
  assert.equal(previewHelp.length,2);
  assert.ok(new URL(previewHelp[1].url).searchParams.get('text').includes('Website preview'));

  assert.equal(await page.locator('#heroTitle').textContent(),'Thoughtful beauty for every occasion.');
  assert.equal(await page.locator('#heroCopy').textContent(),'A welcoming studio offering hair, skin and bridal services.');
  assert.equal(await page.locator('#aboutCopy').textContent(),'Our independent studio helps people feel confident and cared for.');
  assert.equal(await page.locator('#heroPrimary').textContent(),'Request an Appointment');
  assert.equal(await page.locator('#serviceCards .service').count(),3);
  assert.ok((await page.locator('#serviceCards').textContent()).includes('Individual cuts and styling consultations.'));
  assert.ok((await page.locator('#serviceCards').textContent()).includes('Bridal Makeup'));
  assert.ok((await page.locator('.trust').textContent()).includes('Personal attention'));
  assert.equal(await page.locator('#zfFaqSection .zf-faq-item').count(),2);
  assert.ok((await page.locator('#zfFaqSection').textContent()).includes('Do you take bookings?'));
  assert.ok((await page.locator('#zfContactSection').textContent()).includes('Tue–Sat, by appointment'));
  assert.ok((await page.locator('#zfContactSection').textContent()).includes('Local clients and bridal parties'));
  assert.ok(await page.locator('#sitePreview.type-editorial.image-soft').count() === 1);
  assert.ok((await page.locator('#zfHeroVisual img').getAttribute('src')).startsWith('blob:'),
    'Selected real business photo must appear in the preview');

  await page.locator('#customHeadline').fill('A studio that feels like you.');
  assert.equal(await page.locator('#heroTitle').textContent(),'A studio that feels like you.');

  assert.ok(await page.locator('#sitePreview.style-modern.industry-beauty.goal-bookings').count() === 1);
  await page.locator('#demoWrap').screenshot({path:'artifacts/premium-desktop.png', animations:'disabled', timeout:20000});

  await page.locator('[data-studio-action="mobile"]').click();
  assert.equal(await page.locator('[data-studio-action="mobile"]').getAttribute('aria-pressed'),'true');
  const mobile = await page.locator('#demoWrap .browser').evaluate(el => ({
    width:el.getBoundingClientRect().width,
    grid:getComputedStyle(el.querySelector('.zf-hero-layout')).gridTemplateColumns
  }));
  assert.ok(mobile.width <= 425, 'Mobile preview should be phone-sized: ' + JSON.stringify(mobile));
  assert.equal(mobile.grid.trim().split(' ').length,1,'Mobile hero must use a single column: '+mobile.grid);
  await page.locator('#demoWrap').screenshot({path:'artifacts/premium-mobile-toggle.png',animations:'disabled',timeout:20000});

  await page.locator('[data-studio-action="focus"]').click();
  assert.ok(await page.locator('.builder.zf-preview-expanded').count() === 1);
  await page.locator('[data-studio-action="edit"]').click();
  assert.ok(await page.locator('#demoForm').isVisible(), 'Edit button must restore the form');
  assert.equal(await page.locator('#style').inputValue(),'modern');
  await page.locator('[data-style-choice="minimal"]').click();
  await page.locator('#regenerate').click();
  await page.locator('#sitePreview.style-minimal').waitFor();
  if(errors.length) throw new Error('Browser JavaScript errors: '+errors.join('; '));
  console.log('Desktop / mobile toggle / expanded edit / style choice: OK', mobile);
  await page.close();

  const phone = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const phoneErrors = [];
  phone.on('pageerror', err => phoneErrors.push(err.message));
  await fill(phone);
  assert.ok(await phone.locator('#zfAssistHeader').isVisible());
  assert.ok(await phone.locator('#customHeadline').isHidden());
  assert.equal(await phone.locator('#zfEssentialsStatus').textContent(), 'Ready to preview');
  await phone.locator('#demoForm button[type="submit"]').click();
  await phone.locator('#demoWrap.show').waitFor();
  await phone.locator('#demoWrap').screenshot({path:'artifacts/premium-small-screen.png',animations:'disabled',timeout:20000});
  const dimensions = await phone.evaluate(() => ({viewport:innerWidth,body:document.body.scrollWidth,document:document.documentElement.scrollWidth}));
  assert.ok(dimensions.document <= dimensions.viewport + 3, 'Mobile layout should not overflow horizontally: '+JSON.stringify(dimensions));
  if(phoneErrors.length) throw new Error('Phone JavaScript errors: '+phoneErrors.join('; '));
  console.log('390px real mobile viewport, screenshot and overflow: OK', dimensions);
  await phone.close();
} finally {
  await browser.close();
}
