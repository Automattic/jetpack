"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FloatingDelayGroup = FloatingDelayGroup;
exports.useDelayGroup = useDelayGroup;
var React = _interopRequireWildcard(require("react"));
var _useTimeout = require("@base-ui/utils/useTimeout");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useHoverShared = require("../hooks/useHoverShared");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _jsxRuntime = require("react/jsx-runtime");
const FloatingDelayGroupContext = /*#__PURE__*/React.createContext({
  hasProvider: false,
  timeoutMs: 0,
  delayRef: {
    current: 0
  },
  initialDelayRef: {
    current: 0
  },
  timeout: new _useTimeout.Timeout(),
  currentIdRef: {
    current: null
  },
  currentContextRef: {
    current: null
  }
});
if (process.env.NODE_ENV !== "production") FloatingDelayGroupContext.displayName = "FloatingDelayGroupContext";
function resetDelayRef(delayRef, initialDelayRef) {
  delayRef.current = initialDelayRef.current;
}
/**
 * Experimental next version of `FloatingDelayGroup` to become the default
 * in the future. This component is not yet stable.
 * Provides context for a group of floating elements that should share a
 * `delay`. Unlike `FloatingDelayGroup`, `useDelayGroup` with this
 * component does not cause a re-render of unrelated consumers of the
 * context when the delay changes.
 * @see https://floating-ui.com/docs/FloatingDelayGroup
 * @internal
 */
function FloatingDelayGroup(props) {
  const {
    children,
    delay,
    timeoutMs = 0
  } = props;
  const delayRef = React.useRef(delay);
  const initialDelayRef = React.useRef(delay);
  const currentIdRef = React.useRef(null);
  const currentContextRef = React.useRef(null);
  const timeout = (0, _useTimeout.useTimeout)();
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    initialDelayRef.current = delay;
    if (!currentIdRef.current) {
      delayRef.current = delay;
      return;
    }
    delayRef.current = {
      open: (0, _useHoverShared.getDelay)(delayRef.current, 'open'),
      close: (0, _useHoverShared.getDelay)(delay, 'close')
    };
  }, [delay, currentIdRef, delayRef, initialDelayRef]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(FloatingDelayGroupContext.Provider, {
    value: React.useMemo(() => ({
      hasProvider: true,
      delayRef,
      initialDelayRef,
      currentIdRef,
      timeoutMs,
      currentContextRef,
      timeout
    }), [timeoutMs, timeout]),
    children: children
  });
}
/**
 * Enables grouping when called inside a component that's a child of a
 * `FloatingDelayGroup`.
 * @see https://floating-ui.com/docs/FloatingDelayGroup
 * @internal
 */
function useDelayGroup(context, options = {
  open: false
}) {
  const {
    open
  } = options;
  const store = 'rootStore' in context ? context.rootStore : context;
  const floatingId = store.useState('floatingId');
  const groupContext = React.useContext(FloatingDelayGroupContext);
  const {
    currentIdRef,
    delayRef,
    timeoutMs,
    initialDelayRef,
    currentContextRef,
    hasProvider,
    timeout
  } = groupContext;
  const [isInstantPhase, setIsInstantPhase] = React.useState(false);
  const openRef = React.useRef(open);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    openRef.current = open;
  }, [open]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    function unset() {
      currentContextRef.current?.setIsInstantPhase(false);
      currentIdRef.current = null;
      currentContextRef.current = null;
      delayRef.current = initialDelayRef.current;
      timeout.clear();
    }
    if (!currentIdRef.current) {
      return undefined;
    }
    if (!open && currentIdRef.current === floatingId) {
      setIsInstantPhase(false);
      if (timeoutMs) {
        const closingId = floatingId;
        timeout.start(timeoutMs, () => {
          // If another tooltip has taken over the group, skip resetting.
          if (store.select('open') || currentIdRef.current && currentIdRef.current !== closingId) {
            return;
          }
          unset();
        });
        return () => {
          if (openRef.current || currentIdRef.current !== closingId) {
            timeout.clear();
          }
        };
      }
      unset();
    }
    return undefined;
  }, [open, floatingId, currentIdRef, delayRef, timeoutMs, initialDelayRef, currentContextRef, timeout, store]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open) {
      return;
    }
    const prevContext = currentContextRef.current;
    const prevId = currentIdRef.current;

    // A new tooltip is opening, so cancel any pending timeout that would reset
    // the group's delay back to the initial value.
    timeout.clear();
    currentContextRef.current = {
      onOpenChange: store.setOpen,
      setIsInstantPhase
    };
    currentIdRef.current = floatingId;
    delayRef.current = {
      open: 0,
      close: (0, _useHoverShared.getDelay)(initialDelayRef.current, 'close')
    };
    if (prevId !== null && prevId !== floatingId) {
      setIsInstantPhase(true);
      prevContext?.setIsInstantPhase(true);
      prevContext?.onOpenChange(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.none));
    } else {
      setIsInstantPhase(false);
      prevContext?.setIsInstantPhase(false);
    }
  }, [open, floatingId, store, currentIdRef, delayRef, initialDelayRef, currentContextRef, timeout]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    return () => {
      if (currentIdRef.current === floatingId) {
        currentContextRef.current = null;
        if (!openRef.current) {
          return;
        }
        currentIdRef.current = null;
        resetDelayRef(delayRef, initialDelayRef);
        timeout.clear();
      }
    };
  }, [currentContextRef, currentIdRef, delayRef, floatingId, initialDelayRef, timeout]);
  return React.useMemo(() => ({
    activeIdRef: currentIdRef,
    hasProvider,
    delayRef,
    isInstantPhase
  }), [currentIdRef, hasProvider, delayRef, isInstantPhase]);
}