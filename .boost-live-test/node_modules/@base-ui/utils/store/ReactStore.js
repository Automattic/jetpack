"use strict";
/* False positives - ESLint thinks we're calling a hook from a class component. */
/* eslint-disable react-hooks/rules-of-hooks */
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactStore = void 0;
var React = _interopRequireWildcard(require("react"));
var _Store = require("./Store");
var _useStore = require("./useStore");
var _useStableCallback = require("../useStableCallback");
var _useIsoLayoutEffect = require("../useIsoLayoutEffect");
var _empty = require("../empty");
/**
 * A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
 */
class ReactStore extends _Store.Store {
  /**
   * Creates a new ReactStore instance.
   *
   * @param state Initial state of the store.
   * @param context Non-reactive context values.
   * @param selectors Optional selectors for use with `useState`.
   */
  constructor(state, context = {}, selectors) {
    super(state);
    this.context = context;
    this.selectors = selectors;
  }

  /**
   * Non-reactive values such as refs, callbacks, etc.
   */

  /**
   * Synchronizes a single external value into the store.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValue(key, value) {
    React.useDebugValue(key);
    // eslint-disable-next-line consistent-this
    const store = this;
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      if (store.state[key] !== value) {
        store.set(key, value);
      }
    }, [store, key, value]);
  }

  /**
   * Synchronizes a single external value into the store and
   * cleans it up (sets to `undefined`) on unmount.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValueWithCleanup(key, value) {
    // eslint-disable-next-line consistent-this
    const store = this;
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      if (store.state[key] !== value) {
        store.set(key, value);
      }
      return () => {
        store.set(key, undefined);
      };
    }, [store, key, value]);
  }

  /**
   * Synchronizes multiple external values into the store.
   * Each value must match its state key. Pass an exact known subset rather than a broad
   * `Partial<State>`, which may contain `undefined` for required state fields.
   *
   * Note that the while the values in `state` are updated immediately, the values returned
   * by `useState` are updated before the next render (similarly to React's `useState`).
   *
   * @param statePart An exact subset of state fields to synchronize. Unknown keys are not accepted.
   */
  useSyncedValues(statePart) {
    // eslint-disable-next-line consistent-this
    const store = this;
    if (process.env.NODE_ENV !== 'production') {
      // Check that an object with the same shape is passed on every render
      React.useDebugValue(statePart, p => Object.keys(p));
      const keys = React.useRef(Object.keys(statePart)).current;
      const nextKeys = Object.keys(statePart);
      if (keys.length !== nextKeys.length || keys.some((key, index) => key !== nextKeys[index])) {
        console.error('ReactStore.useSyncedValues expects the same prop keys on every render. Keys should be stable.');
      }
    }
    const dependencies = Object.values(statePart);
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      store.update(statePart);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store, ...dependencies]);
  }

  /**
   * Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key. If `controlled`
   * is non-undefined, the store's state at `key` is updated to match `controlled`.
   */
  useControlledProp(key, controlled) {
    React.useDebugValue(key);
    // eslint-disable-next-line consistent-this
    const store = this;
    const isControlled = controlled !== undefined;
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      if (isControlled && !Object.is(store.state[key], controlled)) {
        // Set the internal state to match the controlled value.
        store.setState({
          ...store.state,
          [key]: controlled
        });
      }
    }, [store, key, controlled, isControlled]);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line
      const cache = this.controlledValues ??= new Map();
      if (!cache.has(key)) {
        cache.set(key, isControlled);
      }
      const previouslyControlled = cache.get(key);
      if (previouslyControlled !== undefined && previouslyControlled !== isControlled) {
        console.error(`A component is changing the ${isControlled ? '' : 'un'}controlled state of ${key.toString()} to be ${isControlled ? 'un' : ''}controlled. Elements should not switch from uncontrolled to controlled (or vice versa).`);
      }
    }
  }

  /** Gets the current value from the store using a selector with the provided key.
   *
   * @param key Key of the selector to use.
   */

  select(key, a1, a2, a3) {
    const selector = this.selectors[key];
    return selector(this.state, a1, a2, a3);
  }

  /**
   * Returns a value from the store's state using a selector function.
   * Used to subscribe to specific parts of the state.
   * This methods causes a rerender whenever the selected state changes.
   *
   * @param key Key of the selector to use.
   */

  useState(key, a1, a2, a3) {
    React.useDebugValue(key);
    return (0, _useStore.useStore)(this, this.selectors[key], a1, a2, a3);
  }

  /**
   * Wraps a function with `useStableCallback` to ensure it has a stable reference
   * and assigns it to the context.
   *
   * @param key Key of the event callback. Must be a function in the context.
   * @param fn Function to assign.
   */
  useContextCallback(key, fn) {
    React.useDebugValue(key);
    const stableFunction = (0, _useStableCallback.useStableCallback)(fn ?? _empty.NOOP);
    this.context[key] = stableFunction;
  }

  /**
   * Returns a stable setter function for a specific key in the store's state.
   * It's commonly used to pass as a ref callback to React elements.
   *
   * @param key Key of the state to set.
   */
  useStateSetter(key) {
    const ref = React.useRef(undefined);
    if (ref.current === undefined) {
      ref.current = value => {
        this.set(key, value);
      };
    }
    return ref.current;
  }

  /**
   * Observes changes derived from the store's selectors and calls the listener when the selected value changes.
   *
   * @param key Key of the selector to observe.
   * @param listener Listener function called when the selector result changes.
   */

  observe(selector, listener) {
    let selectFn;
    if (typeof selector === 'function') {
      selectFn = selector;
    } else {
      selectFn = this.selectors[selector];
    }
    let prevValue = selectFn(this.state);
    listener(prevValue, prevValue, this);
    return this.subscribe(nextState => {
      const nextValue = selectFn(nextState);
      if (!Object.is(prevValue, nextValue)) {
        const oldValue = prevValue;
        prevValue = nextValue;
        listener(nextValue, oldValue, this);
      }
    });
  }
}
exports.ReactStore = ReactStore;