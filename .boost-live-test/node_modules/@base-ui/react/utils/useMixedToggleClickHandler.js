"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useMixedToggleClickHandler = useMixedToggleClickHandler;
var React = _interopRequireWildcard(require("react"));
var _owner = require("@base-ui/utils/owner");
var _empty = require("@base-ui/utils/empty");
/**
 * Returns `click` and `mousedown` handlers that fix the behavior of triggers of popups that are toggled by different events.
 * For example, a button that opens a popup on mousedown and closes it on click.
 * This hook prevents the popup from closing immediately after the mouse button is released.
 */
function useMixedToggleClickHandler(params) {
  const {
    enabled = true,
    mouseDownAction,
    open
  } = params;
  const ignoreClickRef = React.useRef(false);
  return React.useMemo(() => {
    if (!enabled) {
      return _empty.EMPTY_OBJECT;
    }
    return {
      onMouseDown: event => {
        if (mouseDownAction === 'open' && !open || mouseDownAction === 'close' && open) {
          ignoreClickRef.current = true;
          (0, _owner.ownerDocument)(event.currentTarget).addEventListener('click', () => {
            ignoreClickRef.current = false;
          }, {
            once: true
          });
        }
      },
      onClick: event => {
        if (ignoreClickRef.current) {
          ignoreClickRef.current = false;
          event.preventBaseUIHandler();
        }
      }
    };
  }, [enabled, mouseDownAction, open]);
}