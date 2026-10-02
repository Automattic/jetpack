'use client';

var _style, _FileJson, _SquareTerminal, _h, _h2, _h3, _CloseIcon, _div, _svg, _svg2, _svg3;
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { mergeCleanups } from "../mergeCleanups.mjs";
import { ownerDocument, ownerWindow } from "../owner.mjs";
import { addEventListener } from "../addEventListener.mjs";
import { useForcedRerendering } from "../useForcedRerendering.mjs";
import { useStableCallback } from "../useStableCallback.mjs";
import { useAnimationFrame } from "../useAnimationFrame.mjs";
import { useIsoLayoutEffect } from "../useIsoLayoutEffect.mjs";
import { useTimeout } from "../useTimeout.mjs";
import { NOOP } from "../empty.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const STYLES = `
.baseui-store-inspector-trigger {
  all: unset;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.651 0.078 264);
}

.baseui-store-inspector-trigger:hover,
.baseui-store-inspector-trigger:focus-visible {
 opacity: 0.8;
}

.baseui-store-inspector-content {
  background: #101010;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: 12px;
  scrollbar-width: thin;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.baseui-store-inspector-content h3 {
  text-transform: uppercase;
  font-weight: bold;
}

.baseui-store-inspector-content pre {
  margin: 0 0 16px 0;
}

.baseui-store-inspector-content pre:last-child {
  margin-bottom: 0;
}

.baseui-store-inspector-root {
  position: fixed;
  background: oklch(0.34 0.036 264);
  color: #fff;
  z-index: 1000;
  font-size: 12px;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 50vw;
  color-scheme: dark;
  overflow: clip;
  box-shadow:
    0 10px 15px -3px oklch(12% 9% 264deg / 8%),
    0 4px 6px -4px oklch(12% 9% 264deg / 8%);
}

.baseui-store-inspector-header {
  display: flex;
  align-items: center;
  cursor: move;
  -webkit-user-select: none;
  user-select: none;
  touch-action: none;
  padding: 4px 8px 8px 8px;
  gap: 8px;

  h2 {
    font-size: 16px;
    flex-grow: 1;
  }
}

.baseui-store-inspector-header button {
  all: unset;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.baseui-store-inspector-header button:hover,
.baseui-store-inspector-header button:focus-visible {
  opacity: 0.8;
}

.baseui-store-inspector-resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  right: -4px;
  bottom: -4px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.25) 50%);
  border-radius: 2px;
}
`;
function getTarget(event) {
  if ('composedPath' in event) {
    return event.composedPath()[0];
  }
  return event.target;
}

/**
 * Minimal shape of a store owner (such as a Base UI popup handle) that exposes a live store to
 * inspect. Typed structurally so this dev utility stays decoupled from the component packages'
 * handle types. The exposed store is loosely typed on purpose: handles narrow it for their public
 * API, but at runtime it is a full `Store`, which the inspector casts to internally.
 */

/**
 * A tool to inspect the state of a Store in a floating panel.
 * This is intended for development and debugging purposes.
 */
export function StoreInspector(props) {
  const {
    title,
    additionalData,
    defaultOpen = false
  } = props;
  const store = useStoreInspectorStore(props);
  const [open, setOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef(null);
  return /*#__PURE__*/_jsxs(React.Fragment, {
    children: [_style || (_style = /*#__PURE__*/_jsx("style", {
      href: "baseui-store-inspector",
      precedence: "default",
      children: STYLES
    })), /*#__PURE__*/_jsx("button", {
      ref: triggerRef,
      className: "baseui-store-inspector-trigger",
      type: "button",
      onClick: event => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(o => !o);
      },
      title: "Toggle store inspector",
      "aria-hidden": true,
      children: _FileJson || (_FileJson = /*#__PURE__*/_jsx(FileJson, {}))
    }), /*#__PURE__*/_jsx(StoreInspectorPanel, {
      anchorElement: triggerRef.current,
      open: open,
      store: store,
      title: title,
      additionalData: additionalData,
      onClose: () => setOpen(false)
    })]
  });
}
function useStoreInspectorStore(props) {
  const handle = props.handle;
  const store = props.store;
  const subscribe = React.useCallback(listener => {
    return handle?.subscribeStore?.(listener) ?? NOOP;
  }, [handle]);
  const getSnapshot = React.useCallback(() => {
    // A handle exposes a narrowed store view for its public API; at runtime it is a full `Store`.
    return store ?? handle?.store;
  }, [handle, store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export function StoreInspectorPanel({
  anchorElement,
  store,
  title,
  additionalData,
  open,
  onClose
}) {
  const rerender = useForcedRerendering();
  const rerenderTimeout = useTimeout();

  // Update when state changes
  useIsoLayoutEffect(() => {
    const unsubscribe = store.subscribe(() => {
      rerenderTimeout.start(1, () => rerender());
    });
    return unsubscribe;
  }, [store, rerender, rerenderTimeout]);
  const logToConsole = useStableCallback(() => {
    const data = {
      state: store.state
    };
    if (Object.keys(store.context ?? {}).length > 0) {
      data.context = store.context;
    }
    if (additionalData !== undefined) {
      data.additionalData = additionalData;
    }

    // eslint-disable-next-line no-console
    console.log(data);
  });
  if (typeof document === 'undefined') {
    return null;
  }
  const doc = ownerDocument(anchorElement);
  const content = /*#__PURE__*/_jsxs(Window, {
    title: title ?? 'Store Inspector',
    onClose: onClose,
    headerActions: /*#__PURE__*/_jsx("button", {
      type: "button",
      onClick: logToConsole,
      title: "Log to console",
      children: _SquareTerminal || (_SquareTerminal = /*#__PURE__*/_jsx(SquareTerminal, {}))
    }),
    children: [_h || (_h = /*#__PURE__*/_jsx("h3", {
      children: "State"
    })), /*#__PURE__*/_jsx("pre", {
      children: JSON.stringify(store.state, getStringifyReplacer(), 2)
    }), Object.keys(store.context ?? {}).length > 0 && /*#__PURE__*/_jsxs(React.Fragment, {
      children: [_h2 || (_h2 = /*#__PURE__*/_jsx("h3", {
        children: "Context"
      })), /*#__PURE__*/_jsx("pre", {
        children: JSON.stringify(store.context, getStringifyReplacer(), 2)
      })]
    }), additionalData !== undefined && /*#__PURE__*/_jsxs(React.Fragment, {
      children: [_h3 || (_h3 = /*#__PURE__*/_jsx("h3", {
        children: "Additional data"
      })), /*#__PURE__*/_jsx("pre", {
        children: JSON.stringify(additionalData, getStringifyReplacer(), 2)
      })]
    })]
  });
  return open ? /*#__PURE__*/ReactDOM.createPortal(content, doc.body) : null;
}
function getStringifyReplacer() {
  const ancestors = [];
  return function replacer(_, value) {
    if (isElement(value)) {
      return `Element(${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ''})`;
    }
    if (value === undefined) {
      return '[undefined]';
    }
    if (value instanceof Map) {
      return Array.from(value.entries());
    }
    if (value instanceof Set) {
      return Array.from(value);
    }
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors.at(-1) !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return '[circular reference]';
    }
    ancestors.push(value);
    return value;
  };
}
/**
 * A reusable draggable and resizable window component.
 * Handles all the pointer events for dragging and resizing internally.
 */
function Window({
  title,
  onClose,
  children,
  headerActions
}) {
  const rootRef = React.useRef(null);
  const headerRef = React.useRef(null);
  const resizeHandleRef = React.useRef(null);
  const raf = useAnimationFrame();
  const minWidth = 160;
  const minHeight = 52;

  // Track position when user drags the window
  const [position, setPosition] = React.useState(null);
  const dragStateRef = React.useRef(null);

  // Track size when user resizes the window
  const [size, setSize] = React.useState(null);
  const resizeStateRef = React.useRef(null);
  useIsoLayoutEffect(() => {
    if (position != null) {
      return;
    }
    const el = rootRef.current;
    if (!el) {
      return;
    }
    setPosition({
      left: 8,
      top: 8
    });
  }, [position]);
  const onPointerDown = useStableCallback(event => {
    if (!headerRef.current || !rootRef.current) {
      return;
    }
    const target = getTarget(event.nativeEvent);
    if (target && target.closest('button')) {
      return;
    }
    const currentPos = position ?? {
      left: 8,
      top: 8
    };
    dragStateRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: currentPos.left,
      startTop: currentPos.top
    };
    try {
      headerRef.current.setPointerCapture(event.pointerId);
    } catch {
      void 0;
    }
    event.preventDefault();
  });
  const endDrag = useStableCallback(event => {
    if (headerRef.current && event) {
      try {
        headerRef.current.releasePointerCapture(event.pointerId);
      } catch {
        void 0;
      }
    }
    if (dragStateRef.current) {
      dragStateRef.current.dragging = false;
    }
  });
  const onPointerMove = useStableCallback(event => {
    const state = dragStateRef.current;
    if (!state || !state.dragging) {
      return;
    }
    const nextLeft = state.startLeft + (event.clientX - state.startX);
    const nextTop = Math.max(0, state.startTop + (event.clientY - state.startY));
    raf.request(() => {
      setPosition({
        left: nextLeft,
        top: nextTop
      });
    });
  });
  const onResizePointerDown = useStableCallback(event => {
    if (!rootRef.current) {
      return;
    }
    const rect = rootRef.current.getBoundingClientRect();
    const currentSize = size ?? {
      width: rect.width,
      height: rect.height
    };
    const currentLeft = position?.left ?? rect.left;
    const currentTop = position?.top ?? rect.top;
    const win = ownerWindow(rootRef.current);
    const maxWidth = Math.max(100, win.innerWidth - currentLeft);
    const maxHeight = Math.max(80, win.innerHeight - currentTop);
    resizeStateRef.current = {
      resizing: true,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: currentSize.width,
      startHeight: currentSize.height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight
    };
    try {
      event.currentTarget?.setPointerCapture?.(event.pointerId);
    } catch {
      void 0;
    }
    event.preventDefault();
  });
  const onResizePointerMove = useStableCallback(event => {
    const state = resizeStateRef.current;
    if (!state || !state.resizing) {
      return;
    }
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    const nextWidth = Math.min(state.maxWidth, Math.max(state.minWidth, state.startWidth + dx));
    const nextHeight = Math.min(state.maxHeight, Math.max(state.minHeight, state.startHeight + dy));
    raf.request(() => {
      setSize({
        width: nextWidth,
        height: nextHeight
      });
    });
  });
  const endResize = useStableCallback(event => {
    if (event) {
      try {
        getTarget(event)?.releasePointerCapture?.(event.pointerId);
      } catch {
        void 0;
      }
    }
    if (resizeStateRef.current) {
      resizeStateRef.current.resizing = false;
    }
  });

  // Bind/unbind global listeners for dragging and resizing
  useIsoLayoutEffect(() => {
    const win = ownerWindow(rootRef.current);
    const move = event => {
      onPointerMove(event);
      onResizePointerMove(event);
    };
    const up = event => {
      endDrag(event);
      endResize(event);
    };
    return mergeCleanups(addEventListener(win, 'pointermove', move), addEventListener(win, 'pointerup', up), addEventListener(win, 'pointercancel', up));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute window style once per render
  const style = {};
  let win = null;
  if (rootRef.current) {
    win = ownerWindow(rootRef.current);
  } else if (typeof window !== 'undefined') {
    win = window;
  }
  const viewportMax = win ? Math.max(0, win.innerHeight - 16) : undefined;
  if (position) {
    style.top = position.top;
    style.left = position.left;
    style.right = 'auto';
    style.position = 'fixed';
    if (size?.width != null) {
      style.width = size.width;
    }
    if (size?.height != null) {
      style.height = size.height;
    }
    style.maxHeight = win ? Math.max(0, win.innerHeight - position.top - 8) : undefined;
  } else {
    if (size?.width != null) {
      style.width = size.width;
    }
    if (size?.height != null) {
      style.height = size.height;
    }
    style.maxHeight = viewportMax;
  }
  return /*#__PURE__*/_jsxs("div", {
    ref: rootRef,
    className: "baseui-store-inspector-root",
    style: style,
    children: [/*#__PURE__*/_jsxs("div", {
      ref: headerRef,
      className: "baseui-store-inspector-header",
      onPointerDown: onPointerDown,
      children: [/*#__PURE__*/_jsx("h2", {
        children: title
      }), headerActions, /*#__PURE__*/_jsx("button", {
        type: "button",
        onClick: onClose,
        title: "Close window",
        children: _CloseIcon || (_CloseIcon = /*#__PURE__*/_jsx(CloseIcon, {}))
      })]
    }), /*#__PURE__*/_jsx("div", {
      className: "baseui-store-inspector-content",
      children: children
    }), /*#__PURE__*/_jsx("div", {
      ref: resizeHandleRef,
      onPointerDown: onResizePointerDown,
      style: {
        position: 'relative'
      },
      children: _div || (_div = /*#__PURE__*/_jsx("div", {
        className: "baseui-store-inspector-resize-handle"
      }))
    })]
  });
}
function CloseIcon() {
  return _svg || (_svg = /*#__PURE__*/_jsxs("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/_jsx("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/_jsx("path", {
      d: "m15 9-6 6"
    }), /*#__PURE__*/_jsx("path", {
      d: "m9 9 6 6"
    })]
  }));
}
function FileJson() {
  return _svg2 || (_svg2 = /*#__PURE__*/_jsxs("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/_jsx("path", {
      d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
    }), /*#__PURE__*/_jsx("path", {
      d: "M14 2v4a2 2 0 0 0 2 2h4"
    }), /*#__PURE__*/_jsx("path", {
      d: "M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"
    }), /*#__PURE__*/_jsx("path", {
      d: "M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"
    })]
  }));
}
function SquareTerminal() {
  return _svg3 || (_svg3 = /*#__PURE__*/_jsxs("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/_jsx("path", {
      d: "m7 11 2-2-2-2"
    }), /*#__PURE__*/_jsx("path", {
      d: "M11 13h4"
    }), /*#__PURE__*/_jsx("rect", {
      width: "18",
      height: "18",
      x: "3",
      y: "3",
      rx: "2",
      ry: "2"
    })]
  }));
}