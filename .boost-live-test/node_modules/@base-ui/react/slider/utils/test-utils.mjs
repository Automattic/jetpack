export function createTouches(touches) {
  return {
    changedTouches: touches.map(touch =>
    // eslint-disable-next-line compat/compat -- used in test environment only
    new Touch({
      target: document.body,
      ...touch
    }))
  };
}
export function getHorizontalSliderRect(width = 100) {
  return new DOMRect(0, 0, width, 10);
}