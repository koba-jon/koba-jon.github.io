function initTabs(tabButtonSelector = '.pub-tab', tabPanelPrefix = 'tab-') {
  const buttons = Array.from(document.querySelectorAll(tabButtonSelector));
  const panelSelector = '.pub-list';
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab;
      document.querySelectorAll(tabButtonSelector).forEach((el) => {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll(panelSelector).forEach((el) => {
        el.classList.remove('active');
        el.hidden = true;
      });
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(`${tabPanelPrefix}${target}`);
      if (panel) {
        panel.classList.add('active');
        panel.hidden = false;
      }
    });
  });
}
window.siteComponents = { initTabs };
