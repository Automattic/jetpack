'use client';

import * as React from 'react';
export const CompositeListContext = /*#__PURE__*/React.createContext({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => () => {},
  nextIndexRef: {
    current: 0
  }
});
if (process.env.NODE_ENV !== "production") CompositeListContext.displayName = "CompositeListContext";
export function useCompositeListContext() {
  return React.useContext(CompositeListContext);
}