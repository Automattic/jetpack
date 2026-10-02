"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRenderElement = useRenderElement;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _getReactElementRef = require("@base-ui/utils/getReactElementRef");
var _mergeObjects = require("@base-ui/utils/mergeObjects");
var _warn = require("@base-ui/utils/warn");
var _empty = require("@base-ui/utils/empty");
var _getStateAttributesProps = require("./getStateAttributesProps");
var _resolveClassName = require("../utils/resolveClassName");
var _resolveStyle = require("../utils/resolveStyle");
var _mergeProps = require("../merge-props");
/**
 * Renders a Base UI element.
 *
 * @param element The default HTML element to render. Can be overridden by the `render` prop.
 * @param componentProps An object containing the `render` and `className` props to be used for element customization. Other props are ignored.
 * @param params Additional parameters for rendering the element.
 */
function useRenderElement(element, componentProps, params = {}) {
  let renderProp = componentProps.render;
  if (params.enabled !== false) {
    // A pending lazy element suspends when unwrapped, so leave it wrapped while disabled.
    renderProp = unwrapLazyRenderProp(renderProp);
  }
  const outProps = useRenderElementProps(componentProps, params, renderProp);
  if (params.enabled === false) {
    return null;
  }
  const state = params.state ?? _empty.EMPTY_OBJECT;
  return evaluateRenderProp(element, renderProp, outProps, state);
}

/**
 * Computes render element final props.
 */
function useRenderElementProps(componentProps, params, renderProp) {
  const {
    className: classNameProp,
    style: styleProp
  } = componentProps;
  const {
    state = _empty.EMPTY_OBJECT,
    ref,
    props,
    stateAttributesMapping,
    enabled = true
  } = params;
  const className = enabled ? (0, _resolveClassName.resolveClassName)(classNameProp, state) : undefined;
  const style = enabled ? (0, _resolveStyle.resolveStyle)(styleProp, state) : undefined;
  const stateProps = enabled ? (0, _getStateAttributesProps.getStateAttributesProps)(state, stateAttributesMapping) : _empty.EMPTY_OBJECT;
  const resolvedProps = enabled && props ? resolveRenderFunctionProps(props) : undefined;

  // Ensure outProps is always a new mutable object when enabled, never EMPTY_OBJECT.
  // This prevents potential TypeError when setting ref, className, or style properties,
  // since EMPTY_OBJECT is frozen and mutations would fail in strict mode.
  const outProps = enabled ? (0, _mergeObjects.mergeObjects)(stateProps, resolvedProps) ?? {} : _empty.EMPTY_OBJECT;

  // SAFETY: The `useMergedRefs` functions use a single hook to store the same value,
  // switching between them at runtime is safe. If this assertion fails, React will
  // throw at runtime anyway.
  // This also skips the `useMergedRefs` call on the server, which is fine because
  // refs are not used on the server side.
  /* eslint-disable react-hooks/rules-of-hooks */
  if (typeof document !== 'undefined') {
    if (!enabled) {
      // Called only to keep the hook order stable when disabled; the merged ref is unused.
      void (0, _useMergedRefs.useMergedRefs)(null, null);
    } else if (Array.isArray(ref)) {
      outProps.ref = (0, _useMergedRefs.useMergedRefsN)([outProps.ref, (0, _getReactElementRef.getReactElementRef)(renderProp), ...ref]);
    } else {
      outProps.ref = (0, _useMergedRefs.useMergedRefs)(outProps.ref, (0, _getReactElementRef.getReactElementRef)(renderProp), ref);
    }
  }
  if (!enabled) {
    return _empty.EMPTY_OBJECT;
  }
  if (className !== undefined) {
    outProps.className = (0, _mergeProps.mergeClassNames)(outProps.className, className);
  }
  if (style !== undefined) {
    outProps.style = (0, _mergeObjects.mergeObjects)(outProps.style, style);
  }
  return outProps;
}
function resolveRenderFunctionProps(props) {
  if (Array.isArray(props)) {
    return (0, _mergeProps.mergePropsN)(props);
  }
  return (0, _mergeProps.mergeProps)(undefined, props);
}

// The symbol React uses internally for lazy components
// https://github.com/react/react/blob/a0566250b210499b4c5677f5ac2eedbd71d51a1b/packages/shared/ReactSymbols.js#L31
//
// TODO delete once https://github.com/react/react/issues/32392 is fixed
const REACT_LAZY_TYPE = Symbol.for('react.lazy');
const COMPONENT_IDENTIFIER_PATTERN = /^[A-Z][A-Za-z0-9$]*$/;
const LOWERCASE_CHARACTER_PATTERN = /[a-z]/;

// Workaround for https://github.com/react/react/issues/32392
// The Flight client hands over a lazy wrapper in place of a render element created in a
// Server Component. The wrapper exposes no `.props` or `.ref`, so it must be unwrapped
// before those are read. This works because the toArray() logic unwraps the lazy
// element type in
// https://github.com/react/react/blob/a0566250b210499b4c5677f5ac2eedbd71d51a1b/packages/react/src/ReactChildren.js#L186
function unwrapLazyRenderProp(render) {
  // `$$typeof` is a React internal, absent from the public element types.
  if (render?.$$typeof !== REACT_LAZY_TYPE) {
    return render;
  }
  // Keep the wrapper unless it unwraps to an element, so an invalid render prop is still
  // reported as one instead of silently falling back to the default element.
  const unwrapped = React.Children.toArray(render)[0];
  return /*#__PURE__*/React.isValidElement(unwrapped) ? unwrapped : render;
}
function evaluateRenderProp(element, render, props, state) {
  if (render) {
    if (typeof render === 'function') {
      if (process.env.NODE_ENV !== 'production') {
        warnIfRenderPropLooksLikeComponent(render);
      }
      return render(props, state);
    }
    const mergedProps = (0, _mergeProps.mergeProps)(props, render.props);
    mergedProps.ref = props.ref;

    // There is a high number of indirections, the error message thrown by React.cloneElement() is
    // hard to use for developers, this logic provides a better context.
    //
    // Our general guideline is to never change the control flow depending on the environment.
    // However, React.cloneElement() throws if React.isValidElement() is false,
    // so we can throw before with custom message.
    if (process.env.NODE_ENV !== 'production') {
      if (! /*#__PURE__*/React.isValidElement(render)) {
        // TODO: fix mui/no-guarded-throw
        // eslint-disable-next-line mui/no-guarded-throw
        throw new Error(['Base UI: The `render` prop was provided an invalid React element as `React.isValidElement(render)` is `false`.', 'A valid React element must be provided to the `render` prop because it is cloned with props to replace the default element.', 'https://base-ui.com/r/invalid-render-prop'].join('\n'));
      }
    }
    return /*#__PURE__*/React.cloneElement(render, mergedProps);
  }
  if (element) {
    if (typeof element === 'string') {
      return renderTag(element, props);
    }
  }
  // Unreachable, but the typings on `useRenderElement` need to be reworked
  // to annotate it correctly.
  throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: Render element or function are not defined.' : (0, _formatErrorMessage2.default)(8));
}
function warnIfRenderPropLooksLikeComponent(renderFn) {
  const functionName = renderFn.name;
  if (functionName.length === 0) {
    return;
  }
  if (!COMPONENT_IDENTIFIER_PATTERN.test(functionName)) {
    return;
  }
  if (!LOWERCASE_CHARACTER_PATTERN.test(functionName)) {
    return;
  }
  (0, _warn.warn)(`The \`render\` prop received a function named \`${functionName}\` that starts with an uppercase letter.`, 'This usually means a React component was passed directly as `render={Component}`.', 'Base UI calls `render` as a plain function, which can break the Rules of Hooks during reconciliation.', 'If this is an intentional render callback, rename it to start with a lowercase letter.', 'Use `render={<Component />}` or `render={(props) => <Component {...props} />}` instead.', 'https://base-ui.com/r/invalid-render-prop');
}
function renderTag(Tag, props) {
  if (Tag === 'button') {
    return /*#__PURE__*/(0, _react.createElement)("button", {
      type: "button",
      ...props,
      key: props.key
    });
  }
  if (Tag === 'img') {
    return /*#__PURE__*/(0, _react.createElement)("img", {
      alt: "",
      ...props,
      key: props.key
    });
  }
  return /*#__PURE__*/React.createElement(Tag, props);
}