"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/ui/src/notice/index.ts
var notice_exports = {};
__export(notice_exports, {
  ActionButton: () => import_action_button.ActionButton,
  ActionLink: () => import_action_link.ActionLink,
  Actions: () => import_actions.Actions,
  CloseIcon: () => import_close_icon.CloseIcon,
  Description: () => import_description.Description,
  Root: () => import_root.Root,
  Title: () => import_title.Title
});
module.exports = __toCommonJS(notice_exports);
var import_root = require("./root.cjs");
var import_title = require("./title.cjs");
var import_description = require("./description.cjs");
var import_actions = require("./actions.cjs");
var import_close_icon = require("./close-icon.cjs");
var import_action_button = require("./action-button.cjs");
var import_action_link = require("./action-link.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionButton,
  ActionLink,
  Actions,
  CloseIcon,
  Description,
  Root,
  Title
});
//# sourceMappingURL=index.cjs.map
