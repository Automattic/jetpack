import { isMouseLikePointerType } from "../utils/event.mjs";
export { isTargetInsideEnabledTrigger as isInsideEnabledTrigger } from "../utils/element.mjs";
function resolveValue(value, pointerType) {
  if (pointerType != null && !isMouseLikePointerType(pointerType)) {
    return 0;
  }
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
export function getDelay(value, prop, pointerType) {
  const result = resolveValue(value, pointerType);
  if (typeof result === 'number') {
    return result;
  }
  return result?.[prop];
}
export function getRestMs(value) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
export function isClickLikeOpenEvent(openEventType, interactedInside) {
  return interactedInside || openEventType === 'click' || openEventType === 'mousedown';
}
export function isHoverOpenEvent(openEventType) {
  return openEventType?.includes('mouse') && openEventType !== 'mousedown';
}