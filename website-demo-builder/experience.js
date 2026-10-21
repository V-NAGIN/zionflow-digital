/*
 * ZionFlow Demo Experience
 * Industry selects content and visual language.
 * Goal selects the conversion journey and section emphasis.
 * Style selects a complete design system, not a colour substitution.
 * All previews are concept layouts; no fabricated ratings, prices, or bookings.
 */
(function () {
  'use strict';

  var INDUSTRIES = {
    local: {
      label: 'Local Service', short: 'Service', type: 'utility', symbol: 'wrench',
      kicker: 'The people to call when it matters',
      headlines: {
        enquiries: 'Reliable help starts with one conversation.',
        bookings: 'Get your next service visit on the calendar.',
        sales: 'Explore practical solutions for your space.',
        showcase: 'Craftsmanship you can see for yourself.'
      },
      intro: 'Straightforward support for homes and businesses.',
      trust: ['Clear service options', 'Local contact details', 'Request a quote'],
      about: 'Put your services, working area and contact details in front of customers who need help.',
      feature: 'A direct, reassuring service journey',
      serviceDetail: 'Understand the service and ask for a tailored response.',
      palette: '#1c4762'
    },
    beauty: {
      label: 'Beauty & Wellness', short: 'Studio', type: 'editorial', symbol: 'sparkle',
      photo: '../beauty-demo/hero-800.webp',
      kicker: 'A little more you, every day',
      headlines: {
        enquiries: 'Your signature look deserves a beautiful introduction.',
        bookings: 'Your next feel-good appointment starts here.',
        sales: 'Find the finishing touches you love.',
        showcase: 'Every detail deserves its moment.'
      },
      intro: 'Thoughtful beauty, barbering and wellness experiences.',
      trust: ['Explore treatments', 'Meet your studio', 'Plan your visit'],
      about: 'Let your studio personality come through while making services and appointment enquiries easy to find.',
      feature: 'A studio-first experience',
      serviceDetail: 'Discover the details of this treatment or offering.',
      palette: '#b17d7b'
    },
    restaurant: {
      label: 'Food & Restaurant', short: 'Kitchen', type: 'cinematic', symbol: 'dining',
      photo: '../restaurant-demo/hero-800.webp',
      kicker: 'Something good is on the table',
      headlines: {
        enquiries: 'A place worth discovering. A taste worth sharing.',
        bookings: 'Make room for your next favourite table.',
        sales: 'A menu worth coming back for.',
        showcase: 'A closer look at what makes us different.'
      },
      intro: 'Explore the menu, atmosphere and what makes every visit special.',
      trust: ['Explore the menu', 'Find the location', 'Plan a visit'],
      about: 'Give guests a feel for the food, setting and experience before they arrive.',
      feature: 'Built around the dining experience',
      serviceDetail: 'See what is on offer and enquire for details.',
      palette: '#8b482f'
    },
    professional: {
      label: 'Professional Services', short: 'Advisory', type: 'corporate', symbol: 'briefcase',
      kicker: 'Clarity meets professional expertise',
      headlines: {
        enquiries: 'The right expertise. A clearer next step.',
        bookings: 'Make time for a focused conversation.',
        sales: 'Specialist solutions, clearly explained.',
        showcase: 'See the thinking behind the work.'
      },
      intro: 'Present your expertise with clarity and confidence.',
      trust: ['Understand services', 'Meet the practice', 'Request a consultation'],
      about: 'Help prospective clients understand your approach, services and how to reach you.',
      feature: 'An expertise-led client journey',
      serviceDetail: 'Review the scope and ask for a consultation.',
      palette: '#23446c'
    },
    construction: {
      label: 'Construction & Property', short: 'Build', type: 'architectural', symbol: 'building',
      photo: '../local-service-demo/images/architecture-800.webp',
      kicker: 'Built with purpose',
      headlines: {
        enquiries: 'From first plans to the finished detail.',
        bookings: 'Start your next project with a site discussion.',
        sales: 'Explore the services behind better spaces.',
        showcase: 'Let the workmanship speak for itself.'
      },
      intro: 'A stronger first impression for your next build or property project.',
      trust: ['Explore capabilities', 'Discuss your project', 'See project direction'],
      about: 'Give clients a clear view of your capabilities, project approach and ways to get in touch.',
      feature: 'Designed for project-led decisions',
      serviceDetail: 'Explore this capability and discuss your project.',
      palette: '#b67c3d'
    },
    automotive: {
      label: 'Automotive', short: 'Motor', type: 'performance', symbol: 'car',
      kicker: 'Performance starts with confidence',
      headlines: {
        enquiries: 'Keep every journey moving.',
        bookings: 'Your next service, a simpler way.',
        sales: 'Find the right option for your vehicle.',
        showcase: 'Precision is in the details.'
      },
      intro: 'Everything drivers need to explore services and make contact.',
      trust: ['Explore vehicle care', 'Ask for assistance', 'Plan a service'],
      about: 'Help drivers quickly see what you offer and how to arrange the next step.',
      feature: 'A driver-first service experience',
      serviceDetail: 'Find out what this service covers for your vehicle.',
      palette: '#d66f42'
    },
    education: {
      label: 'Education', short: 'Learning', type: 'academic', symbol: 'book',
      kicker: 'Learning opens possibilities',
      headlines: {
        enquiries: 'The next chapter begins with curiosity.',
        bookings: 'Make space for your next learning session.',
        sales: 'Find a programme for what comes next.',
        showcase: 'Explore the learning experience.'
      },
      intro: 'Clear programmes and welcoming next steps for learners.',
      trust: ['Explore programmes', 'Understand the approach', 'Ask a question'],
      about: 'Introduce your teaching approach, available programmes and how learners can get started.',
      feature: 'A learner-focused journey',
      serviceDetail: 'Learn what this programme can include.',
      palette: '#337f91'
    },
    accommodation: {
      label: 'Accommodation & Travel', short: 'Stay', type: 'destination', symbol: 'bed',
      kicker: 'A different way to get away',
      headlines: {
        enquiries: 'Your next escape starts with a place to imagine.',
        bookings: 'Find the stay that feels just right.',
        sales: 'Explore stays and travel experiences.',
        showcase: 'Take a closer look before you arrive.'
      },
      intro: 'Give guests a feel for the destination and experience.',
      trust: ['Explore the stay', 'See amenities', 'Enquire about dates'],
      about: 'Show visitors what they can expect, where you are and how to enquire about availability.',
      feature: 'A guest-first journey',
      serviceDetail: 'Discover what this stay or experience offers.',
      palette: '#4c806f'
    },
    retail: {
      label: 'Retail & Ecommerce', short: 'Shop', type: 'commerce', symbol: 'bag',
      kicker: 'Made to be discovered',
      headlines: {
        enquiries: 'The right find begins with a question.',
        bookings: 'Arrange a more personal shopping experience.',
        sales: 'Meet your next favourite find.',
        showcase: 'The collection, beautifully considered.'
      },
      intro: 'Put products, collections and your brand story in focus.',
      trust: ['Browse categories', 'Discover the brand', 'Ask about products'],
      about: 'Make it easy to browse your offering, understand the brand and enquire about products.',
      feature: 'Designed for product discovery',
      serviceDetail: 'Explore options in this collection.',
      palette: '#775f97'
    },
    other: {
      label: 'Your Industry', short: 'Brand', type: 'studio', symbol: 'compass',
      kicker: 'A different approach starts here',
      headlines: {
        enquiries: 'Bring your next big idea into focus.',
        bookings: 'Make the next step easy to arrange.',
        sales: 'Give your offer the space it deserves.',
        showcase: 'Let your best work lead the way.'
      },
      intro: 'Built around what makes your business your own.',
      trust: ['Discover the offering', 'Explore your approach', 'Make contact'],
      about: 'Explain what you do and give people a confident, direct path to the next step.',
      feature: 'A website shaped around your business',
      serviceDetail: 'Explore this offering and ask for more details.',
      palette: '#656f86'
    }
  };

  var GOALS = {
    enquiries: {
      label: 'Enquiries', nav: ['Home', 'Services', 'About', 'Contact'],
      action: 'Get a Quote', secondary: 'Explore Services',
      section: 'How we can help', eyebrow: 'SERVICES',
      overline: 'LET US TALK', featureTitle: 'An easier way to get in touch.',
      featureCopy: 'Help potential customers find the right service, understand the next step and contact your business.',
      steps: ['Explore what you offer', 'Tell us what you need', 'Start the conversation'],
      ctaTitle: 'Tell us what you have in mind.',
      ctaCopy: 'Reach out to discuss the service that is right for you.'
    },
    bookings: {
      label: 'Bookings', nav: ['Home', 'Experiences', 'How to Book', 'Contact'],
      action: 'Book Now', secondary: 'Explore Options',
      section: 'Choose your experience', eyebrow: 'APPOINTMENTS & EXPERIENCES',
      overline: 'PLAN YOUR VISIT', featureTitle: 'Make your next visit simple.',
      featureCopy: 'A booking-focused journey that guides visitors from discovering options to requesting a suitable date.',
      steps: ['Choose a service', 'Request a date', 'Confirm the details'],
      ctaTitle: 'Ready to plan your visit?',
      ctaCopy: 'Send a booking enquiry and arrange the details directly.'
    },
    sales: {
      label: 'Sales', nav: ['Home', 'Shop', 'Collections', 'Contact'],
      action: 'Explore Products', secondary: 'Browse Collection',
      section: 'Explore the collection', eyebrow: 'SHOP & DISCOVER',
      overline: 'DISCOVER THE OFFERING', featureTitle: 'Find something worth choosing.',
      featureCopy: 'A product-led layout that makes your offering easier to browse and compare.',
      steps: ['Browse your options', 'Find your favourite', 'Enquire to order'],
      ctaTitle: 'Something caught your eye?',
      ctaCopy: 'Get in touch about product details and next steps.'
    },
    showcase: {
      label: 'Portfolio', nav: ['Home', 'Our Work', 'About', 'Contact'],
      action: 'View Our Work', secondary: 'Our Approach',
      section: 'What makes the work stand out', eyebrow: 'THE WORK',
      overline: 'SELECTED WORK CONCEPT', featureTitle: 'Put your best work in the spotlight.',
      featureCopy: 'A gallery-led layout that gives visitors a sense of your work and specialties.',
      steps: ['Discover the work', 'Explore the details', 'Discuss your idea'],
      ctaTitle: 'Have a project in mind?',
      ctaCopy: 'Let us talk about what we could create together.'
    }
  };

  var STYLES = {
    premium: {label: 'Premium & professional', composition: 'atelier', descriptor: 'Refined, high-contrast, considered'},
    modern: {label: 'Modern & clean', composition: 'open', descriptor: 'Fresh, practical, structured'},
    bold: {label: 'Bold & energetic', composition: 'impact', descriptor: 'Expressive, striking, high-energy'},
    minimal: {label: 'Minimal & elegant', composition: 'editorial', descriptor: 'Quiet, intentional, spacious'}
  };

  var ICONS = {
    wrench: '<path d="M13 5a5 5 0 0 0-6.7 6.7L3 15l6 6 3.3-3.3A5 5 0 0 0 19 11l-4 2-4-4 2-4z"/>',
    sparkle: '<path d="m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1L12 2z"/>',
    dining: '<path d="M4 2v8a4 4 0 0 0 8 0V2M8 2v20M19 2c-2 4-3 7-3 10h4v10"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12c5 3 13 3 18 0"/>',
    building: '<path d="M4 22V9l8-5 8 5v13M9 22v-7h6v7M8 11h1m6 0h1M4 22h16"/>',
    car: '<path d="m5 11 2-6h10l2 6M4 11h16l1 3v5h-3v-2H6v2H3v-5zM7 14h2m6 0h2"/>',
    book: '<path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1zm0 0v14"/>',
    bed: '<path d="M3 21V8M21 21V8M3 14h18v5H3zM6 14V8h5v6m2 0V8h5v6"/>',
    bag: '<path d="M5 8h14l1 14H4L5 8zM9 9V6a3 3 0 0 1 6 0v3"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 2 2-6 4-2z"/>'
  };

  function clean(value, max) {
    return String(value == null ? '' : value).trim().slice(0, max || 250);
  }
  function escapeHtml(value) {
    return clean(value, 400).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function safeKey(value, dictionary, fallback) {
    return Object.prototype.hasOwnProperty.call(dictionary, value) ? value : fallback;
  }
  function contrastText(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
    var c = [1,3,5].map(function (i) {
      var v = parseInt(hex.slice(i, i+2), 16) / 255;
      return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    return (0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]) > 0.36 ? '#131b25' : '#ffffff';
  }

  function buildPlan(input) {
    var industry = safeKey(input.industry, INDUSTRIES, 'other');
    var goal = safeKey(input.goal, GOALS, 'enquiries');
    var style = safeKey(input.style, STYLES, 'premium');
    var profile = INDUSTRIES[industry];
    var conversion = GOALS[goal];
    var design = STYLES[style];
    var name = clean(input.name, 120) || 'Your Business';
    var location = clean(input.location, 100);
    var customIndustry = clean(input.otherIndustry, 70);
    var industryLabel = industry === 'other' && customIndustry ? customIndustry : profile.label;
    var submitted = clean(input.services, 500);
    var services = submitted.split(/[,;\n]+/).map(function (s) {return clean(s, 85);}).filter(Boolean);
    services = services.concat(profile.trust).slice(0, 3);
    var firstTwo = services.slice(0, 2).join(' and ');
    var goalCopy = {
      enquiries: 'Explore ' + firstTwo + ' and ask us about what you need.',
      bookings: 'Discover ' + firstTwo + ' and get in touch to arrange your visit.',
      sales: 'Browse ' + firstTwo + ' and explore the options that suit you.',
      showcase: 'Get a closer look at ' + firstTwo + ' and our creative approach.'
    };

    var customAction = conversion.action;
    if (goal === 'bookings' && industry === 'restaurant') customAction = 'Reserve a Table';
    if (goal === 'bookings' && industry === 'accommodation') customAction = 'Enquire About Dates';
    if (goal === 'bookings' && industry === 'professional') customAction = 'Book a Consultation';
    if (goal === 'bookings' && industry === 'education') customAction = 'Enquire About Sessions';
    if (goal === 'sales' && industry === 'restaurant') customAction = 'Explore Our Menu';

    return {
      industry: industry, goal: goal, style: style,
      category: profile.type, symbol: profile.symbol, photo: profile.photo || '',
      name: name, industryLabel: industryLabel, location: location,
      headline: profile.headlines[goal], kicker: profile.kicker,
      copy: submitted ? goalCopy[goal] : profile.intro,
      primaryAction: customAction, secondaryAction: conversion.secondary,
      nav: conversion.nav, trust: profile.trust, services: services,
      eyebrow: conversion.eyebrow, servicesHeading: conversion.section,
      serviceDetail: profile.serviceDetail,
      about: profile.about, aboutLabel: profile.feature,
      goalOverline: conversion.overline, goalFeatureTitle: conversion.featureTitle,
      goalFeatureCopy: conversion.featureCopy, goalSteps: conversion.steps,
      ctaTitle: conversion.ctaTitle, ctaCopy: conversion.ctaCopy,
      styleName: design.label, designDescriptor: design.descriptor,
      composition: design.composition, palette: profile.palette,
      primary: /^#[0-9a-f]{6}$/i.test(input.primary || '') ? input.primary : '#c9a227',
      phone: clean(input.phone, 60)
    };
  }

  function iconSvg(kind) {
    return '<svg class="zf-illustration-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[kind] || ICONS.compass) + '</svg>';
  }

  function ensureStructure() {
    var site = document.getElementById('sitePreview');
    if (!site) return null;
    var hero = site.querySelector('.hero');
    var heroCopy = hero && hero.querySelector('.zf-hero-copy');
    if (hero && !heroCopy) {
      var shell = document.createElement('div');
      shell.className = 'zf-hero-layout';
      heroCopy = document.createElement('div');
      heroCopy.className = 'zf-hero-copy';
      var elements = Array.from(hero.children);
      elements.forEach(function (el) { heroCopy.appendChild(el); });
      shell.appendChild(heroCopy);
      var visual = document.createElement('div');
      visual.className = 'zf-hero-visual';
      visual.id = 'zfHeroVisual';
      visual.setAttribute('aria-hidden', 'true');
      shell.appendChild(visual);
      hero.appendChild(shell);
    }
    var spotlight = site.querySelector('#zfGoalSpotlight');
    if (!spotlight) {
      spotlight = document.createElement('section');
      spotlight.id = 'zfGoalSpotlight';
      spotlight.className = 'zf-goal-spotlight';
      spotlight.setAttribute('aria-label','Website goal preview');
      var trust = site.querySelector('.trust');
      site.insertBefore(spotlight, trust);
    }
    var serviceSection = site.querySelector('.section:not(.about)');
    if (serviceSection) serviceSection.classList.add('zf-services-section');
    return site;
  }

  function drawVisual(plan) {
    var media = document.getElementById('zfHeroVisual');
    if (!media) return;
    var photo = plan.photo
      ? '<img class="zf-industry-photo" src="' + plan.photo + '" alt="" loading="eager" decoding="async">'
      : '<div class="zf-abstract-art"><span class="zf-orbit zf-orbit-one"></span><span class="zf-orbit zf-orbit-two"></span>' +
        iconSvg(plan.symbol) + '</div>';
    media.innerHTML =
      '<div class="zf-visual-frame">' + photo +
      '<span class="zf-visual-topline">' + escapeHtml(plan.industryLabel) + ' / ' + escapeHtml(plan.styleName) + '</span>' +
      '<div class="zf-visual-footer"><strong>' + escapeHtml(plan.services[0]) + '</strong>' +
      '<span>' + escapeHtml(plan.services[1]) + '</span></div></div>' +
      '<div class="zf-float-chip"><span class="zf-chip-dot"></span>' + escapeHtml(plan.goalOverline) + '</div>';
  }

  function drawSpotlight(plan) {
    var target = document.getElementById('zfGoalSpotlight');
    if (!target) return;
    var tiles = plan.goalSteps.map(function (step, index) {
      return '<div class="zf-feature-step"><span class="zf-feature-number">0' + (index+1) +
        '</span><strong>' + escapeHtml(step) + '</strong></div>';
    }).join('');
    var subject = plan.services.map(function (item, index) {
      return '<article class="zf-feature-tile"><span class="zf-feature-tag">' +
        (plan.goal === 'showcase' ? 'PORTFOLIO IDEA' : plan.goal === 'sales' ? 'COLLECTION ' + (index+1) : 'OPTION ' + (index+1)) +
        '</span><strong>' + escapeHtml(item) + '</strong>' +
        '<span class="zf-feature-link">' + (plan.goal === 'showcase' ? 'Explore direction' : 'View details') +
        ' <span aria-hidden="true">↗</span></span></article>';
    }).join('');
    target.innerHTML =
      '<div class="zf-feature-intro"><small>' + escapeHtml(plan.goalOverline) + '</small>' +
      '<h3>' + escapeHtml(plan.goalFeatureTitle) + '</h3>' +
      '<p>' + escapeHtml(plan.goalFeatureCopy) + '</p></div>' +
      (plan.goal === 'showcase' || plan.goal === 'sales'
        ? '<div class="zf-feature-tiles">' + subject + '</div>'
        : '<div class="zf-feature-steps">' + tiles + '</div>');
  }

  function drawServices(plan) {
    var target = document.getElementById('serviceCards');
    if (!target) return;
    target.innerHTML = plan.services.map(function (service, i) {
      return '<div class="service"><i>0' + (i + 1) + '</i>' +
        '<strong>' + escapeHtml(service) + '</strong><p>' +
        escapeHtml(plan.serviceDetail) + '</p></div>';
    }).join('');
  }

  function applyPlan(plan) {
    var site = ensureStructure();
    if (!site) return;
    site.className = 'site zf-experience industry-' + plan.industry +
      ' goal-' + plan.goal + ' style-' + plan.style + ' layout-' + plan.category;
    site.style.setProperty('--primary', plan.primary);
    site.style.setProperty('--on-primary', contrastText(plan.primary));
    site.style.setProperty('--industry-hue', plan.palette);

    function text(id, value) {
      var node = document.getElementById(id);
      if (node) node.textContent = value;
    }
    text('heroKicker', plan.kicker + (plan.location ? ' · ' + plan.location : ''));
    text('heroTitle', plan.headline);
    text('heroCopy', plan.copy);
    text('heroPrimary', plan.primaryAction);
    text('navCta', plan.primaryAction);
    text('servicesEyebrow', plan.eyebrow);
    text('aboutTitle', 'Discover ' + plan.name);
    text('aboutCopy', plan.about);
    text('aboutCard', plan.aboutLabel + (plan.location ? ' · ' + plan.location : ''));
    text('ctaTitle', plan.ctaTitle);
    text('ctaCopy', plan.ctaCopy);
    text('ctaButton', plan.primaryAction);
    text('demoIndustry', plan.industryLabel + ' · ' + plan.styleName + ' · ' + GOALS[plan.goal].label);

    var secondary = site.querySelector('.hero-btn.secondary');
    if (secondary) secondary.textContent = plan.secondaryAction;
    var heading = site.querySelector('.zf-services-section h3');
    if (heading) heading.textContent = plan.servicesHeading;
    var links = site.querySelectorAll('.navlinks span');
    Array.from(links).forEach(function (item, index) {
      item.textContent = plan.nav[index] || '';
    });
    var trust = site.querySelectorAll('.trust div');
    Array.from(trust).forEach(function (item, index) {
      if (!plan.trust[index]) return;
      var strong = item.querySelector('strong');
      var note = item.querySelector('span');
      if (strong) strong.textContent = plan.trust[index];
      if (note) note.textContent = index === 0 ? 'Discover more' : index === 1 ? 'Understand the details' : 'Take the next step';
    });

    drawVisual(plan);
    drawSpotlight(plan);
    drawServices(plan);
  }

  function collectInputs() {
    function val(id) {
      var el = document.getElementById(id);
      return el ? el.value : '';
    }
    return {
      industry: val('industry'), goal: val('goal'), style: val('style'),
      name: val('business'), services: val('services'), location: val('location'),
      otherIndustry: val('otherIndustry'), phone: val('phone'), primary: val('primary')
    };
  }

  document.addEventListener('zf-demo-rendered', function () {
    applyPlan(buildPlan(collectInputs()));
  });

  document.addEventListener('change', function (event) {
    var changed = event.target && event.target.id;
    if (['industry','goal','style','primary'].indexOf(changed) < 0) return;
    var preview = document.getElementById('demoWrap');
    if (!preview || !preview.classList.contains('show')) return;
    var update = document.getElementById('regenerate');
    if (update) update.click();
  });

  window.ZionFlowDemoExperience = Object.freeze({buildPlan: buildPlan});
})();
