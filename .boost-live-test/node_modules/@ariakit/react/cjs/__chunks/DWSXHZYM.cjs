"use strict";Object.defineProperty(exports, "__esModule", {value: true});// ../ariakit-react-components/dist/heading/heading-context.js
var _react = require('react');
var HeadingContext = _react.createContext.call(void 0, 0);

// ../ariakit-react-components/dist/heading/heading-level.js

var _jsxruntime = require('react/jsx-runtime');
function HeadingLevel({ level, children }) {
  const contextLevel = _react.useContext.call(void 0, HeadingContext);
  const nextLevel = Math.max(Math.min(level || contextLevel + 1, 6), 1);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, HeadingContext.Provider, {
    value: nextLevel,
    children
  });
}




exports.HeadingContext = HeadingContext; exports.HeadingLevel = HeadingLevel;
