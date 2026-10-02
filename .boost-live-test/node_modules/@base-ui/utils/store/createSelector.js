"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSelector = void 0;
var _formatErrorMessage2 = _interopRequireDefault(require("../formatErrorMessage.js"));
/**
 * The NoOptionalParams type is a utility type that checks if a function has optional or default parameters.
 * If the function has optional or default parameters, it returns a string literal type with an error message.
 * Otherwise, it returns the original function type.
 *
 * This is used to enforce that the combiner function passed to createSelector does not have optional or default parameters,
 * as memoization relies on the Function.length property, which does not account for optional or default parameters.
 */

/**
 * The combiner parameters that remain once the input selector results are accounted for.
 * In the single-function form the first parameter is the state, not a selector result.
 */

/**
 * Both variants forward at most three arguments beyond the input selector results, so a
 * statically-known count above three is rejected. An open-ended count cannot be validated
 * statically: it occurs both for rest parameters and for combiners typed contextually,
 * which are indistinguishable here. `createSelectorMemoized` throws on the parameter
 * counts this check cannot see; `createSelector` passes three arguments regardless.
 */

/**
 * `createSelector` dispatches through unrolled fixed arities and supports at most seven
 * input selectors. A non-tuple selector list has no statically known count and passes;
 * the runtime throws for it instead. The single-function form is returned verbatim, so it
 * keeps its own signature and is not bound by the extra-argument limit.
 */

/**
 * The type of `createSelector`.
 */

/**
 * The type of `createSelectorMemoized`. Unlike `createSelector`, the memoized runtime
 * dispatches on Function.length, and the single-function form still requires the state
 * object because it carries the cache key.
 */

/**
 * Creates a selector function that can be used to derive values from the store's state.
 *
 * The combiner function can have up to three additional parameters, but it **cannot have optional or default parameters**.
 *
 * This function accepts up to seven input selectors plus a combiner and combines them into a single selector function.
 * The resulting selector will take the state from the combined selectors and any additional parameters required by the combiner.
 *
 * The return type of the resulting selector is determined by the return type of the combiner function.
 *
 * @example
 * const selector = createSelector(
 *  (state) => state.disabled
 * );
 *
 * @example
 * const selector = createSelector(
 *   (state) => state.disabled,
 *   (state) => state.open,
 *   (disabled, open) => ({ disabled, open })
 * );
 */
/* eslint-disable id-denylist */
const createSelector = (a, b, c, d, e, f, g, h, ...other) => {
  if (other.length > 0) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Unsupported number of selectors' : (0, _formatErrorMessage2.default)(1));
  }
  let selector;
  if (a && b && c && d && e && f && g && h) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      const vf = f(state, a1, a2, a3);
      const vg = g(state, a1, a2, a3);
      return h(va, vb, vc, vd, ve, vf, vg, a1, a2, a3);
    };
  } else if (a && b && c && d && e && f && g) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      const vf = f(state, a1, a2, a3);
      return g(va, vb, vc, vd, ve, vf, a1, a2, a3);
    };
  } else if (a && b && c && d && e && f) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      const ve = e(state, a1, a2, a3);
      return f(va, vb, vc, vd, ve, a1, a2, a3);
    };
  } else if (a && b && c && d && e) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      const vd = d(state, a1, a2, a3);
      return e(va, vb, vc, vd, a1, a2, a3);
    };
  } else if (a && b && c && d) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      const vc = c(state, a1, a2, a3);
      return d(va, vb, vc, a1, a2, a3);
    };
  } else if (a && b && c) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      const vb = b(state, a1, a2, a3);
      return c(va, vb, a1, a2, a3);
    };
  } else if (a && b) {
    selector = (state, a1, a2, a3) => {
      const va = a(state, a1, a2, a3);
      return b(va, a1, a2, a3);
    };
  } else if (a) {
    selector = a;
  } else {
    throw /* minify-error-disabled */new Error('Missing arguments');
  }
  return selector;
};
/* eslint-enable id-denylist */
exports.createSelector = createSelector;