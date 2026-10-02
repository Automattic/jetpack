"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useOpenChangeComplete = useOpenChangeComplete;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useAnimationsFinished = require("./useAnimationsFinished");
/**
 * Calls the provided function when the CSS open/close animation or transition completes.
 */
function useOpenChangeComplete(parameters) {
  const {
    enabled = true,
    open,
    ref,
    batch = false,
    onComplete: onCompleteParam
  } = parameters;
  const onComplete = (0, _useStableCallback.useStableCallback)(onCompleteParam);
  const runOnceAnimationsFinish = (0, _useAnimationsFinished.useAnimationsFinished)(ref, open, batch);
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const abortController = new AbortController();
    runOnceAnimationsFinish(onComplete, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [enabled, open, onComplete, runOnceAnimationsFinish]);
}