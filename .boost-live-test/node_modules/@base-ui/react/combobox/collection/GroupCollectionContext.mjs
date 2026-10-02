'use client';

import * as React from 'react';
import { jsx as _jsx } from "react/jsx-runtime";
const GroupCollectionContext = /*#__PURE__*/React.createContext(null);
if (process.env.NODE_ENV !== "production") GroupCollectionContext.displayName = "GroupCollectionContext";
export function useGroupCollectionContext() {
  return React.useContext(GroupCollectionContext);
}
export function GroupCollectionProvider(props) {
  const {
    children,
    items
  } = props;
  const contextValue = React.useMemo(() => ({
    items
  }), [items]);
  return /*#__PURE__*/_jsx(GroupCollectionContext.Provider, {
    value: contextValue,
    children: children
  });
}