var _Toast$Title, _Toast$Description, _Toast$Close, _Toast$Action;
import { Toast } from '@base-ui/react/toast';

/**
 * @internal
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Button() {
  const {
    add
  } = Toast.useToastManager();
  return /*#__PURE__*/_jsx("button", {
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
export function List() {
  return Toast.useToastManager().toasts.map(toastItem => /*#__PURE__*/_jsxs(Toast.Root, {
    toast: toastItem,
    "data-testid": "root",
    children: [_Toast$Title || (_Toast$Title = /*#__PURE__*/_jsx(Toast.Title, {
      "data-testid": "title"
    })), _Toast$Description || (_Toast$Description = /*#__PURE__*/_jsx(Toast.Description, {
      "data-testid": "description"
    })), _Toast$Close || (_Toast$Close = /*#__PURE__*/_jsx(Toast.Close, {
      "aria-label": "close-press"
    })), _Toast$Action || (_Toast$Action = /*#__PURE__*/_jsx(Toast.Action, {
      "data-testid": "action"
    }))]
  }, toastItem.id));
}