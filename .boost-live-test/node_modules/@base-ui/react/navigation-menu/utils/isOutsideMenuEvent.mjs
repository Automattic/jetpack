import { contains, getNodeChildren } from "../../floating-ui-react/utils.mjs";
export function isOutsideMenuEvent({
  currentTarget,
  relatedTarget
}, params) {
  const {
    popupElement,
    rootRef,
    tree,
    nodeId
  } = params;
  const nodeChildrenContains = tree ? getNodeChildren(tree.nodesRef.current, nodeId).some(node => contains(node.context?.elements.floating, relatedTarget)) : false;
  if (!popupElement) {
    return !contains(rootRef.current, relatedTarget) && !nodeChildrenContains;
  }
  return !contains(popupElement, currentTarget) && !contains(popupElement, relatedTarget) && !contains(rootRef.current, relatedTarget) && !nodeChildrenContains;
}