import * as React from 'react';
import { isReactVersionAtLeast } from "./reactVersion.mjs";

/**
 * Extracts the `ref` from a React element, handling different React versions.
 */
export function getReactElementRef(element) {
  if (! /*#__PURE__*/React.isValidElement(element)) {
    return null;
  }
  const reactElement = element;
  const propsWithRef = reactElement.props;
  return (isReactVersionAtLeast(19) ? propsWithRef?.ref : reactElement.ref) ?? null;
}