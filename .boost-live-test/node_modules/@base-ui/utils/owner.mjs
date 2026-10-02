export { getWindow as ownerWindow } from '@floating-ui/utils/dom';
export function ownerDocument(node) {
  return node?.ownerDocument || document;
}