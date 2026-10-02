"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePopupHandleStore = usePopupHandleStore;
var React = _interopRequireWildcard(require("react"));
var _shim = require("use-sync-external-store/shim");
var _empty = require("@base-ui/utils/empty");
/**
 * Reads the store currently exposed by a popup handle and subscribes to store-pointer changes.
 * Detached triggers use this to follow a handle as a root attaches or detaches: while no root is
 * attached, the handle exposes its fallback store; once a root attaches, subscribers re-render and
 * read from the live root store.
 *
 * Returns `undefined` when no handle is provided so callers can fall back to their root context.
 *
 * @param handle The popup handle to read from, or `undefined` when the trigger is not handle-bound.
 */
function usePopupHandleStore(handle) {
  const subscribe = React.useCallback(listener => {
    if (handle === undefined) {
      return _empty.NOOP;
    }
    return handle.subscribeStore(listener);
  }, [handle]);
  const getSnapshot = React.useCallback(() => {
    return handle === undefined ? undefined : handle.store;
  }, [handle]);
  return (0, _shim.useSyncExternalStore)(subscribe, getSnapshot, () => handle?.serverStore);
}