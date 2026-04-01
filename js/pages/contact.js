(async function () {
  const { loadJson, initSiteChrome } = window.siteUtils;
  await initSiteChrome();

  try {
    const profile = await loadJson('data/profile.json');
    const realEmail = profile.email_display.replace(' [at] ', '@');

    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-form-status');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const subject = form.subject.value.trim();
      const message = form.message.value.trim();

      if (!subject || !message) {
        status.textContent = 'Please fill in subject and message.';
        return;
      }

      const mailtoUrl = `mailto:${realEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoUrl;
      status.textContent = 'Opening email client...';
    });
  } catch (error) {
    console.warn(error);
  }
})();
