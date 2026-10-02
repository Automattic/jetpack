"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY = void 0;
exports.useInitialLiveRegionTextMutation = useInitialLiveRegionTextMutation;
var React = _interopRequireWildcard(require("react"));
var _platform = require("@base-ui/utils/platform");
var _useTimeout = require("@base-ui/utils/useTimeout");
// Word Joiner is invisible and zero-width, so it forces a text mutation without shifting layout.
const LIVE_REGION_MARKER = '\u2060';
// Safari VoiceOver needed roughly 200ms to reliably notice the initial polite live-region change.
const INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY = exports.INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY = 200;
function findLastTextNode(root) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let lastTextNode = null;
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (textNode.nodeValue !== '') {
      lastTextNode = textNode;
    }
  }
  return lastTextNode;
}
function useInitialLiveRegionTextMutation() {
  const timeout = (0, _useTimeout.useTimeout)();
  const rootRef = React.useRef(null);

  // Only the initial mounted announcement needs the marker; later text updates announce naturally.
  React.useEffect(() => {
    if (_platform.platform.os.ios) {
      return undefined;
    }
    const root = rootRef.current;
    if (root == null) {
      return undefined;
    }
    const textNode = findLastTextNode(root);
    if (textNode == null) {
      return undefined;
    }
    const originalValue = textNode.data;
    const markedValue = `${originalValue}${LIVE_REGION_MARKER}`;
    textNode.nodeValue = markedValue;
    timeout.start(INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY, () => {
      if (textNode.nodeValue === markedValue) {
        textNode.nodeValue = originalValue;
      }
    });
    return () => {
      timeout.clear();
      if (textNode.nodeValue === markedValue) {
        textNode.nodeValue = originalValue;
      }
    };
  }, [rootRef, timeout]);
  return rootRef;
}