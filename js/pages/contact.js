(async function () {
  const { loadJson, initSiteChrome } = window.siteUtils;
  await initSiteChrome();

  try {
    const profile = await loadJson('data/profile.json');
    const realEmail = profile.email_display.replace(' [at] ', '@');
    const submitEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(realEmail)}`;

    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-form-status');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const subject = form.elements.subject.value.trim();
      const message = form.elements.message.value.trim();

      if (!name || !email || !subject || !message) {
        status.textContent = 'Please fill in all fields.';
        return;
      }

      status.textContent = 'Sending...';

      try {
        const response = await fetch(submitEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            subject,
            message,
            _subject: `[Homepage] ${subject}`,
            _captcha: 'false',
            _template: 'table',
          }),
        });

        const result = await response.json();
        if (!response.ok || result.success !== 'true') {
          throw new Error(result.message || 'Failed to send message.');
        }

        status.textContent = 'Message sent successfully.';
        form.reset();
      } catch (error) {
        console.warn(error);
        status.textContent = 'Failed to send message. Please try again later.';
      }
    });
  } catch (error) {
    console.warn(error);
  }
})();
