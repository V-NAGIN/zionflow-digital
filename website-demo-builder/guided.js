/* ZionFlow guided builder — progressive disclosure and real team assistance.
   No personal details are transmitted until the customer chooses to send their WhatsApp message.
   The existing preview and full request workflows remain unchanged. */
(() => {
  'use strict';
  function init() {
    const form = document.getElementById('demoForm');
    const first = document.getElementById('customHeadline')?.closest('.field');
    const status = document.getElementById('zfEssentialsStatus');
    if (!form || !first || !status || form.dataset.easyReady) return;
    form.dataset.easyReady = 'true';

    const advancedFields = [
      'customHeadline','customSubheading','aboutStory','serviceDetails','whyChoose',
      'faqDetails','targetAudience','businessHours','buttonText','headingFont','imageMood'
    ];
    const advancedNodes = advancedFields.map(id => document.getElementById(id)?.closest('.field')).filter(Boolean);
    const heading = first.previousElementSibling;
    if (heading?.classList.contains('zf-studio-section')) {
      heading.classList.add('zf-easy-advanced-heading');
      const title = heading.querySelector('strong');
      const description = heading.querySelector('small');
      if (title) title.textContent = 'Make it more personal (optional)';
      if (description) description.textContent = 'Happy with the automatic design? Skip this. Want more control? Add your own details.';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'zfAdvancedToggle';
      toggle.className = 'zf-easy-toggle';
      toggle.setAttribute('aria-controls','zfAdvancedControls');
      toggle.setAttribute('aria-expanded','false');
      toggle.textContent = 'Show more options +';
      heading.appendChild(toggle);
      // The advanced controls already live in the original form grid. Grouping uses
      // the heading + aria-expanded, and keeps the original DOM input identifiers.
      heading.id = 'zfAdvancedControls';

      function setExpanded(open) {
        advancedNodes.forEach(node => {
          node.hidden = !open;
          node.classList.add('zf-easy-advanced-field');
        });
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Hide extra options −' : 'Show more options +';
      }
      toggle.addEventListener('click', () => {
        setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
      });
      setExpanded(false);
    }

    function updateEssentials() {
      const ready = ['business','industry','services'].filter(id => {
        const node = document.getElementById(id);
        return Boolean(node && node.value.trim());
      }).length;
      status.textContent = ready === 3 ? 'Ready to preview' : ready + ' of 3 essentials ready';
      status.classList.toggle('zf-easy-ready', ready === 3);
      status.setAttribute('aria-label', status.textContent);
    }
    form.addEventListener('input',updateEssentials);
    form.addEventListener('change',updateEssentials);
    updateEssentials();

    ['zfAssistHeader','zfAssistForm','zfAssistPreview'].forEach(id => {
      const button = document.getElementById(id);
      if (!button) return;
      button.addEventListener('click',() => {
        const helper = window.ZionFlowWebsiteAssistance;
        if (helper && typeof helper.open === 'function') helper.open();
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init,{once:true});
  } else init();
})();
