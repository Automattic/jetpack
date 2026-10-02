"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useIsHydrating = useIsHydrating;
var _shim = require("use-sync-external-store/shim");
var _noop = require("../internals/noop");
function subscribe() {
  return _noop.NOOP;
}
function getSnapshot() {
  return false;
}
function getServerSnapshot() {
  return true;
}

/**
 * Returns `true` while React is hydrating server-rendered markup and `false`
 * for fresh client-only mounts.
 */
function useIsHydrating() {
  return (0, _shim.useSyncExternalStore)(subscribe, getSnapshot, getServerSnapshot);
}