export function getOffset(element, prop, axis) {
  if (!element) {
    return 0;
  }
  const styles = getComputedStyle(element);
  const key = `${prop}${axis === 'x' ? 'Inline' : 'Block'}`;
  const start = parseFloat(styles[`${key}Start`]);

  // Safari misreports `marginInlineEnd` in RTL.
  // We have to assume the start/end values are symmetrical, which is likely.
  if (axis === 'x' && prop === 'margin') {
    return start * 2;
  }
  return start + parseFloat(styles[`${key}End`]);
}