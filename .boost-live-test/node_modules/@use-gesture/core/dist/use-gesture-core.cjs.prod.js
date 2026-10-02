'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var actions_dist_useGestureCoreActions = require('./actions-89e642c9.cjs.prod.js');
require('./maths-83bc6f64.cjs.prod.js');

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}

const sharedConfigResolver = {
  target(value) {
    if (value) {
      return () => 'current' in value ? value.current : value;
    }
    return undefined;
  },
  enabled(value = true) {
    return value;
  },
  window(value = actions_dist_useGestureCoreActions.SUPPORT.isBrowser ? window : undefined) {
    return value;
  },
  eventOptions({
    passive = true,
    capture = false
  } = {}) {
    return {
      passive,
      capture
    };
  },
  transform(value) {
    return value;
  }
};

const _excluded = ["target", "eventOptions", "window", "enabled", "transform"];
function resolveWith(config = {}, resolvers) {
  const result = {};
  for (const [key, resolver] of Object.entries(resolvers)) {
    switch (typeof resolver) {
      case 'function':
        {
          result[key] = resolver.call(result, config[key], key, config);
        }
        break;
      case 'object':
        result[key] = resolveWith(config[key], resolver);
        break;
      case 'boolean':
        if (resolver) result[key] = config[key];
        break;
    }
  }
  return result;
}
function parse(newConfig, gestureKey, _config = {}) {
  const _ref = newConfig,
    {
      target,
      eventOptions,
      window,
      enabled,
      transform
    } = _ref,
    rest = _objectWithoutProperties(_ref, _excluded);
  _config.shared = resolveWith({
    target,
    eventOptions,
    window,
    enabled,
    transform
  }, sharedConfigResolver);
  if (gestureKey) {
    const resolver = actions_dist_useGestureCoreActions.ConfigResolverMap.get(gestureKey);
    _config[gestureKey] = resolveWith(actions_dist_useGestureCoreActions._objectSpread2({
      shared: _config.shared
    }, rest), resolver);
  } else {
    for (const key in rest) {
      const resolver = actions_dist_useGestureCoreActions.ConfigResolverMap.get(key);
      if (resolver) {
        _config[key] = resolveWith(actions_dist_useGestureCoreActions._objectSpread2({
          shared: _config.shared
        }, rest[key]), resolver);
      }
    }
  }
  return _config;
}

class EventStore {
  constructor(ctrl, gestureKey) {
    actions_dist_useGestureCoreActions._defineProperty(this, "_listeners", new Set());
    this._ctrl = ctrl;
    this._gestureKey = gestureKey;
  }
  add(element, device, action, handler, options) {
    const listeners = this._listeners;
    const type = actions_dist_useGestureCoreActions.toDomEventType(device, action);
    const _options = this._gestureKey ? this._ctrl.config[this._gestureKey].eventOptions : {};
    const eventOptions = actions_dist_useGestureCoreActions._objectSpread2(actions_dist_useGestureCoreActions._objectSpread2({}, _options), options);
    element.addEventListener(type, handler, eventOptions);
    const remove = () => {
      element.removeEventListener(type, handler, eventOptions);
      listeners.delete(remove);
    };
    listeners.add(remove);
    return remove;
  }
  clean() {
    this._listeners.forEach(remove => remove());
    this._listeners.clear();
  }
}

class TimeoutStore {
  constructor() {
    actions_dist_useGestureCoreActions._defineProperty(this, "_timeouts", new Map());
  }
  add(key, callback, ms = 140, ...args) {
    this.remove(key);
    this._timeouts.set(key, window.setTimeout(callback, ms, ...args));
  }
  remove(key) {
    const timeout = this._timeouts.get(key);
    if (timeout) window.clearTimeout(timeout);
  }
  clean() {
    this._timeouts.forEach(timeout => void window.clearTimeout(timeout));
    this._timeouts.clear();
  }
}

class Controller {
  constructor(handlers) {
    actions_dist_useGestureCoreActions._defineProperty(this, "gestures", new Set());
    actions_dist_useGestureCoreActions._defineProperty(this, "_targetEventStore", new EventStore(this));
    actions_dist_useGestureCoreActions._defineProperty(this, "gestureEventStores", {});
    actions_dist_useGestureCoreActions._defineProperty(this, "gestureTimeoutStores", {});
    actions_dist_useGestureCoreActions._defineProperty(this, "handlers", {});
    actions_dist_useGestureCoreActions._defineProperty(this, "config", {});
    actions_dist_useGestureCoreActions._defineProperty(this, "pointerIds", new Set());
    actions_dist_useGestureCoreActions._defineProperty(this, "touchIds", new Set());
    actions_dist_useGestureCoreActions._defineProperty(this, "state", {
      shared: {
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false
      }
    });
    resolveGestures(this, handlers);
  }
  setEventIds(event) {
    if (actions_dist_useGestureCoreActions.isTouch(event)) {
      this.touchIds = new Set(actions_dist_useGestureCoreActions.touchIds(event));
      return this.touchIds;
    } else if ('pointerId' in event) {
      if (event.type === 'pointerup' || event.type === 'pointercancel') this.pointerIds.delete(event.pointerId);else if (event.type === 'pointerdown') this.pointerIds.add(event.pointerId);
      return this.pointerIds;
    }
  }
  applyHandlers(handlers, nativeHandlers) {
    this.handlers = handlers;
    this.nativeHandlers = nativeHandlers;
  }
  applyConfig(config, gestureKey) {
    this.config = parse(config, gestureKey, this.config);
  }
  clean() {
    this._targetEventStore.clean();
    for (const key of this.gestures) {
      this.gestureEventStores[key].clean();
      this.gestureTimeoutStores[key].clean();
    }
  }
  effect() {
    if (this.config.shared.target) this.bind();
    return () => this._targetEventStore.clean();
  }
  bind(...args) {
    const sharedConfig = this.config.shared;
    const props = {};
    let target;
    if (sharedConfig.target) {
      target = sharedConfig.target();
      if (!target) return;
    }
    if (sharedConfig.enabled) {
      for (const gestureKey of this.gestures) {
        const gestureConfig = this.config[gestureKey];
        const bindFunction = bindToProps(props, gestureConfig.eventOptions, !!target);
        if (gestureConfig.enabled) {
          const Engine = actions_dist_useGestureCoreActions.EngineMap.get(gestureKey);
          new Engine(this, args, gestureKey).bind(bindFunction);
        }
      }
      const nativeBindFunction = bindToProps(props, sharedConfig.eventOptions, !!target);
      for (const eventKey in this.nativeHandlers) {
        nativeBindFunction(eventKey, '', event => this.nativeHandlers[eventKey](actions_dist_useGestureCoreActions._objectSpread2(actions_dist_useGestureCoreActions._objectSpread2({}, this.state.shared), {}, {
          event,
          args
        })), undefined, true);
      }
    }
    for (const handlerProp in props) {
      props[handlerProp] = actions_dist_useGestureCoreActions.chain(...props[handlerProp]);
    }
    if (!target) return props;
    for (const handlerProp in props) {
      const {
        device,
        capture,
        passive
      } = actions_dist_useGestureCoreActions.parseProp(handlerProp);
      this._targetEventStore.add(target, device, '', props[handlerProp], {
        capture,
        passive
      });
    }
  }
}
function setupGesture(ctrl, gestureKey) {
  ctrl.gestures.add(gestureKey);
  ctrl.gestureEventStores[gestureKey] = new EventStore(ctrl, gestureKey);
  ctrl.gestureTimeoutStores[gestureKey] = new TimeoutStore();
}
function resolveGestures(ctrl, internalHandlers) {
  if (internalHandlers.drag) setupGesture(ctrl, 'drag');
  if (internalHandlers.wheel) setupGesture(ctrl, 'wheel');
  if (internalHandlers.scroll) setupGesture(ctrl, 'scroll');
  if (internalHandlers.move) setupGesture(ctrl, 'move');
  if (internalHandlers.pinch) setupGesture(ctrl, 'pinch');
  if (internalHandlers.hover) setupGesture(ctrl, 'hover');
}
const bindToProps = (props, eventOptions, withPassiveOption) => (device, action, handler, options = {}, isNative = false) => {
  var _options$capture, _options$passive;
  const capture = (_options$capture = options.capture) !== null && _options$capture !== void 0 ? _options$capture : eventOptions.capture;
  const passive = (_options$passive = options.passive) !== null && _options$passive !== void 0 ? _options$passive : eventOptions.passive;
  let handlerProp = isNative ? device : actions_dist_useGestureCoreActions.toHandlerProp(device, action, capture);
  if (withPassiveOption && passive) handlerProp += 'Passive';
  props[handlerProp] = props[handlerProp] || [];
  props[handlerProp].push(handler);
};

const RE_NOT_NATIVE = /^on(Drag|Wheel|Scroll|Move|Pinch|Hover)/;
function sortHandlers(_handlers) {
  const native = {};
  const handlers = {};
  const actions = new Set();
  for (let key in _handlers) {
    if (RE_NOT_NATIVE.test(key)) {
      actions.add(RegExp.lastMatch);
      handlers[key] = _handlers[key];
    } else {
      native[key] = _handlers[key];
    }
  }
  return [handlers, native, actions];
}
function registerGesture(actions, handlers, handlerKey, key, internalHandlers, config) {
  if (!actions.has(handlerKey)) return;
  if (!actions_dist_useGestureCoreActions.EngineMap.has(key)) {
    return;
  }
  const startKey = handlerKey + 'Start';
  const endKey = handlerKey + 'End';
  const fn = state => {
    let memo = undefined;
    if (state.first && startKey in handlers) handlers[startKey](state);
    if (handlerKey in handlers) memo = handlers[handlerKey](state);
    if (state.last && endKey in handlers) handlers[endKey](state);
    return memo;
  };
  internalHandlers[key] = fn;
  config[key] = config[key] || {};
}
function parseMergedHandlers(mergedHandlers, mergedConfig) {
  const [handlers, nativeHandlers, actions] = sortHandlers(mergedHandlers);
  const internalHandlers = {};
  registerGesture(actions, handlers, 'onDrag', 'drag', internalHandlers, mergedConfig);
  registerGesture(actions, handlers, 'onWheel', 'wheel', internalHandlers, mergedConfig);
  registerGesture(actions, handlers, 'onScroll', 'scroll', internalHandlers, mergedConfig);
  registerGesture(actions, handlers, 'onPinch', 'pinch', internalHandlers, mergedConfig);
  registerGesture(actions, handlers, 'onMove', 'move', internalHandlers, mergedConfig);
  registerGesture(actions, handlers, 'onHover', 'hover', internalHandlers, mergedConfig);
  return {
    handlers: internalHandlers,
    config: mergedConfig,
    nativeHandlers
  };
}

exports.Controller = Controller;
exports.parseMergedHandlers = parseMergedHandlers;
