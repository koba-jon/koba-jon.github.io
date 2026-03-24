function initTabs(tabButtonSelector = '.pub-tab', tabPanelPrefix = 'tab-') {
  const buttons = Array.from(document.querySelectorAll(tabButtonSelector));
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab;
      document.querySelectorAll('.pub-tab').forEach((el) => el.classList.remove('active'));
      document.querySelectorAll('.pub-list').forEach((el) => el.classList.remove('active'));
      button.classList.add('active');
      const panel = document.getElementById(`${tabPanelPrefix}${target}`);
      if (panel) panel.classList.add('active');
    });
  });
}
window.siteComponents = { initTabs };
