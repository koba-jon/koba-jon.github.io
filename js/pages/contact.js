(async function () {
  const { loadJson, initSiteChrome } = window.siteUtils;
  await initSiteChrome();

  try {
    const profile = await loadJson('data/profile.json');
    const displayedEmail = profile.email_display;
    const realEmail = displayedEmail.replace(' [at] ', '@');

    const email = document.getElementById('email-display');
    const copyButton = document.getElementById('copy-email-btn');
    const copyStatus = document.getElementById('copy-status');

    email.textContent = displayedEmail;
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(realEmail);
        copyStatus.textContent = 'Copied';
        setTimeout(() => { copyStatus.textContent = ''; }, 2000);
      } catch (error) {
        copyStatus.textContent = 'Copy failed';
      }
    });
  } catch (error) {
    console.warn(error);
  }
})();
