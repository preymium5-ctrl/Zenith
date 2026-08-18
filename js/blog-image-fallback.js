(() => {
  const fallback = '/images/blog/insights-thumbnail.svg';

  function useFallback(image) {
    if (image.dataset.localFallbackApplied) return;
    image.dataset.localFallbackApplied = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = image.dataset.originalSrc.includes('Blog_Gravite.png')
      ? '/images/blog/gravite.png'
      : fallback;
  }

  document.querySelectorAll('img.resources_image').forEach((image) => {
    image.dataset.originalSrc = image.getAttribute('src') || '';
    image.addEventListener('error', () => useFallback(image), { once: true });
    if (image.complete && image.naturalWidth === 0) useFallback(image);
  });
})();
