export function isElementDisabled(element) {
  return element == null || element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
}