export function clearStyles(element, originalStyles) {
  if (element) {
    Object.assign(element.style, originalStyles);
  }
}
export const LIST_FUNCTIONAL_STYLES = {
  position: 'relative',
  maxHeight: '100%',
  overflowX: 'hidden',
  overflowY: 'auto'
};