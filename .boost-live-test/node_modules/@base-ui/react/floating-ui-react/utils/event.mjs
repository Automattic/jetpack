import { platform } from '@base-ui/utils/platform';
export function stopEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}
export function isReactEvent(event) {
  return 'nativeEvent' in event;
}

// License: https://github.com/adobe/react-spectrum/blob/main/packages/@react-aria/utils/src/isVirtualEvent.ts
export function isVirtualClick(event) {
  if (event.pointerType === '' && event.isTrusted) {
    return true;
  }
  if (platform.os.android && event.pointerType) {
    return event.type === 'click' && event.buttons === 1;
  }
  return event.detail === 0 && !event.pointerType;
}
export function isVirtualPointerEvent(event) {
  if (platform.env.jsdom) {
    return false;
  }
  return !platform.os.android && event.width === 0 && event.height === 0 || platform.os.android && event.width === 1 && event.height === 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === 'mouse' ||
  // iOS VoiceOver returns 0.333• for width/height.
  event.width < 1 && event.height < 1 && event.pressure === 0 && event.detail === 0 && event.pointerType === 'touch';
}
export function isMouseLikePointerType(pointerType, strict) {
  // On some Linux machines with Chromium, mouse inputs return a `pointerType`
  // of "pen": https://github.com/floating-ui/floating-ui/issues/2015
  const values = ['mouse', 'pen'];
  if (!strict) {
    values.push('', undefined);
  }
  return values.includes(pointerType);
}
export function isClickLikeEvent(event) {
  const type = event.type;
  return type === 'click' || type === 'mousedown' || type === 'keydown' || type === 'keyup';
}