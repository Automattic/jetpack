"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCompositeListItem = useCompositeListItem;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _CompositeListContext = require("./CompositeListContext");
/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
function useCompositeListItem(params = {}) {
  const {
    guess,
    label,
    metadata,
    textRef,
    index: externalIndex
  } = params;
  const {
    register,
    unregister,
    subscribeMapChange,
    nextIndexRef
  } = (0, _CompositeListContext.useCompositeListContext)();

  // Guess the index from the render order. This avoids a re-render after mount for
  // flat lists rendered in DOM order; when the guess is wrong (grouped or out-of-order
  // rendering), the commit flush corrects it before paint.
  const indexRef = React.useRef(-1);
  const [internalIndex, setInternalIndex] = React.useState(externalIndex == null && guess ? () => {
    if (indexRef.current === -1) {
      const newIndex = nextIndexRef.current;
      nextIndexRef.current += 1;
      indexRef.current = newIndex;
    }
    return indexRef.current;
  } : -1);
  const index = externalIndex ?? internalIndex;
  const componentRef = React.useRef(null);

  // Deliberately identity-sensitive: nested items sharing one DOM node rely on ref attachment
  // order to decide which registration wins, and republishing from an effect instead would let
  // an inner item's later update silently take ownership from the outer one.
  const ref = React.useCallback(node => {
    const previousNode = componentRef.current;
    if (previousNode) {
      unregister(previousNode);
    }
    componentRef.current = node;
    if (node) {
      register(node, {
        metadata: metadata ?? null,
        index: externalIndex ?? null,
        label,
        textRef
      });
    }
  }, [externalIndex, register, unregister, metadata, label, textRef]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (externalIndex != null) {
      return undefined;
    }
    return subscribeMapChange(map => {
      const i = componentRef.current ? map.get(componentRef.current)?.index : null;
      if (i != null) {
        setInternalIndex(i);
      }
    });
  }, [externalIndex, subscribeMapChange]);
  return {
    ref,
    index
  };
}