const skipLink = document.querySelector('.skip-link');

skipLink?.addEventListener('click', () => {
  const target = document.querySelector(skipLink.hash);
  requestAnimationFrame(() => target?.focus());
});
