(function () {
  const displayedEmail = 'koba37b8011 [at] gmail.com';
  const realEmail = displayedEmail.replace(' [at] ', '@');

  const copyBtn    = document.getElementById('copy-email-btn');
  const copyStatus = document.getElementById('copy-status');

  copyBtn.addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(realEmail);
      copyStatus.textContent = 'Copied';
      setTimeout(function () { copyStatus.textContent = ''; }, 2000);
    } catch (err) {
      copyStatus.textContent = 'Copy failed';
    }
  });
})();
