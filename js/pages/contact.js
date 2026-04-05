(async function () {
  const { loadJson, initSiteChrome, t, getCurrentLanguage, formatMessage } = window.siteUtils;
  await initSiteChrome();

  try {
    const profile = await loadJson('data/profile.json');
    const recipients = (Array.isArray(profile.contact_recipients)
      ? profile.contact_recipients
      : [])
      .map((email) => email.replace(' [at] ', '@').trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      throw new Error('No contact recipients configured.');
    }

    const primaryRecipient = recipients[0];
    const ccRecipients = recipients.slice(1);
    const submitEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(primaryRecipient)}`;
    const startedAt = Date.now();
    const storageKeys = {
      cooldownUntil: 'contactFormCooldownUntil',
    };
    const minimumFillMs = 3_000;
    const cooldownMs = 30_000;

    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-form-status');
    const setStatus = (key, values = {}) => {
      status.textContent = formatMessage(t(key, getCurrentLanguage()), values);
    };

    const getCooldownRemainingMs = () => {
      const cooldownUntil = Number.parseInt(localStorage.getItem(storageKeys.cooldownUntil) || '0', 10);
      if (!Number.isFinite(cooldownUntil)) return 0;
      return Math.max(0, cooldownUntil - Date.now());
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const subject = form.elements.subject.value.trim();
      const message = form.elements.message.value.trim();
      const website = form.elements.website?.value?.trim() || '';

      if (!name || !email || !subject || !message) {
        setStatus('contact.fillAll');
        return;
      }

      if (website) {
        setStatus('contact.unavailable');
        return;
      }

      if (Date.now() - startedAt < minimumFillMs) {
        setStatus('contact.waitBeforeSubmit');
        return;
      }

      const cooldownRemainingMs = getCooldownRemainingMs();
      if (cooldownRemainingMs > 0) {
        const seconds = Math.ceil(cooldownRemainingMs / 1000);
        setStatus('contact.waitBeforeNext', { seconds });
        return;
      }

      setStatus('contact.sending');

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
            _honey: 'website',
            _captcha: 'false',
            ...(ccRecipients.length ? { _cc: ccRecipients.join(',') } : {}),
            _template: 'table',
          }),
        });

        const result = await response.json();
        const isSuccess =
          response.ok &&
          (result.success === true || result.success === 'true');

        if (!isSuccess) {
          throw new Error(result.message || 'Failed to send message.');
        }

        setStatus('contact.sent');
        localStorage.setItem(storageKeys.cooldownUntil, String(Date.now() + cooldownMs));
        form.reset();
      } catch (error) {
        console.warn(error);
        setStatus('contact.failed');
      }
    });
  } catch (error) {
    console.warn(error);
  }
})();
