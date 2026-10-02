"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Button = Button;
exports.List = List;
var _toast = require("@base-ui/react/toast");
var _jsxRuntime = require("react/jsx-runtime");
var _Toast$Title, _Toast$Description, _Toast$Close, _Toast$Action;
/**
 * @internal
 */
function Button() {
  const {
    add
  } = _toast.Toast.useToastManager();
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
    type: "button",
    onClick: () => {
      add({
        title: 'title',
        description: 'description',
        actionProps: {
          id: 'action',
          children: 'action'
        }
      });
    },
    children: "add"
  });
}

/**
 * @internal
 */
function List() {
  return _toast.Toast.useToastManager().toasts.map(toastItem => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_toast.Toast.Root, {
    toast: toastItem,
    "data-testid": "root",
    children: [_Toast$Title || (_Toast$Title = /*#__PURE__*/(0, _jsxRuntime.jsx)(_toast.Toast.Title, {
      "data-testid": "title"
    })), _Toast$Description || (_Toast$Description = /*#__PURE__*/(0, _jsxRuntime.jsx)(_toast.Toast.Description, {
      "data-testid": "description"
    })), _Toast$Close || (_Toast$Close = /*#__PURE__*/(0, _jsxRuntime.jsx)(_toast.Toast.Close, {
      "aria-label": "close-press"
    })), _Toast$Action || (_Toast$Action = /*#__PURE__*/(0, _jsxRuntime.jsx)(_toast.Toast.Action, {
      "data-testid": "action"
    }))]
  }, toastItem.id));
}