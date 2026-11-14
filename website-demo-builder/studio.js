/* ZionFlow premium studio controls.
   Enhances presentation only; form submission and preview rendering remain owned by the existing scripts. */
(() => {
  'use strict';

  function init() {
    const builder = document.querySelector('.builder');
    const form = document.getElementById('demoForm');
    const panel = document.getElementById('demoWrap');
    const toolbar = panel?.querySelector('.demo-toolbar');
    const grid = form?.querySelector('.grid');
    if (!builder || !form || !panel || !toolbar || !grid || builder.dataset.studioReady) return;
    builder.dataset.studioReady = 'true';

    function addSection(beforeFieldId, number, title, description) {
      const field = document.getElementById(beforeFieldId)?.closest('.field');
      if (!field || !grid.contains(field)) return;
      const section = document.createElement('div');
      section.className = 'zf-studio-section';
      section.innerHTML =
        '<span class="zf-studio-number" aria-hidden="true">' + number + '</span>' +
        '<div><strong></strong><small></small></div>';
      section.querySelector('strong').textContent = title;
      section.querySelector('small').textContent = description;
      grid.insertBefore(section, field);
    }

    addSection('business', '01', 'Business details', 'Tell us what your business offers.');
    addSection('customHeadline', '02', 'Your website content', 'Make the words, services and key details genuinely yours.');
    addSection('logo', '03', 'Look & feel', 'Add your identity and choose the design direction.');

    const headerLabel = builder.querySelector('.eyebrow');
    if (headerLabel) headerLabel.textContent = 'ZIONFLOW / FREE WEBSITE STUDIO';

    const file = document.getElementById('logo');
    if (file) file.setAttribute('aria-label', 'Upload your business logo');

    // Visual design choices stay in sync with the original select and its existing renderer.
    const styleSelect = document.getElementById('style');
    const styleField = styleSelect?.closest('.field');
    if (styleSelect && styleField) {
      const picker = document.createElement('div');
      picker.className = 'zf-style-picker';
      picker.setAttribute('role', 'group');
      picker.setAttribute('aria-label', 'Choose your website style');
      const choices = [
        ['premium', 'Premium', 'Refined & confident'],
        ['modern', 'Modern', 'Clean & open'],
        ['bold', 'Bold', 'Distinctive & energetic'],
        ['minimal', 'Minimal', 'Quiet & elegant']
      ];
      const buttons = [];
      choices.forEach(([value, label, description]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'zf-style-option';
        button.dataset.styleChoice = value;
        button.innerHTML = '<span class="zf-style-swatch zf-style-swatch-' + value +
          '" aria-hidden="true"><i></i><b></b><em></em></span>' +
          '<strong></strong><small></small>';
        button.querySelector('strong').textContent = label;
        button.querySelector('small').textContent = description;
        button.addEventListener('click', () => {
          styleSelect.value = value;
          styleSelect.dispatchEvent(new Event('change', {bubbles: true}));
          refreshStyle();
        });
        picker.appendChild(button);
        buttons.push(button);
      });
      function refreshStyle() {
        buttons.forEach(button => {
          button.setAttribute('aria-pressed', String(button.dataset.styleChoice === styleSelect.value));
        });
      }
      styleField.appendChild(picker);
      styleSelect.classList.add('zf-studio-native-style');
      styleSelect.setAttribute('aria-hidden', 'true');
      styleSelect.tabIndex = -1;
      styleSelect.addEventListener('change', refreshStyle);
      refreshStyle();
    }

    const previewInfo = document.createElement('div');
    previewInfo.className = 'zf-studio-preview-note';
    previewInfo.textContent = 'Interactive concept preview. Final website details are confirmed with ZionFlow.';
    toolbar.after(previewInfo);

    const controls = document.createElement('div');
    controls.className = 'zf-studio-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Website preview controls');

    function makeButton(label, name) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'zf-studio-control';
      b.textContent = label;
      b.dataset.studioAction = name;
      controls.appendChild(b);
      return b;
    }

    const desktop = makeButton('Desktop', 'desktop');
    const mobile = makeButton('Mobile', 'mobile');
    const focus = makeButton('Expand', 'focus');
    const edit = makeButton('Edit details', 'edit');
    toolbar.appendChild(controls);

    function selectDevice(type) {
      const isMobile = type === 'mobile';
      panel.classList.toggle('zf-preview-mobile', isMobile);
      desktop.setAttribute('aria-pressed', String(!isMobile));
      mobile.setAttribute('aria-pressed', String(isMobile));
      panel.dataset.previewDevice = type;
    }

    function setExpanded(expanded) {
      builder.classList.toggle('zf-preview-expanded', expanded);
      focus.textContent = expanded ? 'Exit expanded view' : 'Expand';
      focus.setAttribute('aria-pressed', String(expanded));
      edit.hidden = !expanded;
    }

    desktop.addEventListener('click', () => selectDevice('desktop'));
    mobile.addEventListener('click', () => selectDevice('mobile'));
    focus.addEventListener('click', () => setExpanded(!builder.classList.contains('zf-preview-expanded')));
    edit.addEventListener('click', () => {
      setExpanded(false);
      form.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
      document.getElementById('business')?.focus({preventScroll: true});
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && builder.classList.contains('zf-preview-expanded')) setExpanded(false);
    });

    selectDevice('desktop');
    setExpanded(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else init();
})();
