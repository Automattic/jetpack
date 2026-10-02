'use client';

import * as React from 'react';
import { NOOP } from "../noop.mjs";
/**
 * A context for providing [labelable elements](https://html.spec.whatwg.org/multipage/forms.html#category-label)\
 * with an accessible name (label) and description.
 */
export const LabelableContext = /*#__PURE__*/React.createContext({
  controlId: undefined,
  registerControlId: NOOP,
  resetControlId: NOOP,
  labelId: undefined,
  setLabelId: NOOP,
  messageIds: [],
  setMessageIds: NOOP,
  getDescriptionProps: externalProps => externalProps
});
if (process.env.NODE_ENV !== "production") LabelableContext.displayName = "LabelableContext";
export function useLabelableContext() {
  return React.useContext(LabelableContext);
}