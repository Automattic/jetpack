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

// packages/rich-text/src/hook/use-format-types.js
var use_format_types_exports = {};
__export(use_format_types_exports, {
  useFormatTypes: () => useFormatTypes
});
module.exports = __toCommonJS(use_format_types_exports);
var import_element = require("@wordpress/element");
var import_data = require("@wordpress/data");
var import_store = require("../store/index.cjs");
function formatTypesSelector(select) {
  return select(import_store.store).getFormatTypes();
}
var interactiveContentTags = /* @__PURE__ */ new Set([
  "a",
  "audio",
  "button",
  "details",
  "embed",
  "iframe",
  "input",
  "label",
  "select",
  "textarea",
  "video"
]);
function prefixSelectKeys(selected, prefix) {
  if (typeof selected !== "object") {
    return { [prefix]: selected };
  }
  return Object.fromEntries(
    Object.entries(selected).map(([key, value]) => [
      `${prefix}.${key}`,
      value
    ])
  );
}
function getPrefixedSelectKeys(selected, prefix) {
  if (selected[prefix]) {
    return selected[prefix];
  }
  return Object.keys(selected).filter((key) => key.startsWith(prefix + ".")).reduce((accumulator, key) => {
    accumulator[key.slice(prefix.length + 1)] = selected[key];
    return accumulator;
  }, {});
}
function useFormatTypes({
  allowedFormats,
  withoutInteractiveFormatting,
  __unstableFormatTypeHandlerContext
}) {
  const allFormatTypes = (0, import_data.useSelect)(formatTypesSelector, []);
  const formatTypes = (0, import_element.useMemo)(() => {
    return allFormatTypes.filter(({ name, interactive, tagName }) => {
      if (allowedFormats && !allowedFormats.includes(name)) {
        return false;
      }
      if (withoutInteractiveFormatting && (interactive || interactiveContentTags.has(tagName))) {
        return false;
      }
      return true;
    });
  }, [allFormatTypes, allowedFormats, withoutInteractiveFormatting]);
  const keyedSelected = (0, import_data.useSelect)(
    (select) => formatTypes.reduce((accumulator, type) => {
      if (!type.__experimentalGetPropsForEditableTreePreparation || !__unstableFormatTypeHandlerContext) {
        return accumulator;
      }
      return {
        ...accumulator,
        ...prefixSelectKeys(
          type.__experimentalGetPropsForEditableTreePreparation(
            select,
            __unstableFormatTypeHandlerContext
          ),
          type.name
        )
      };
    }, {}),
    [formatTypes, __unstableFormatTypeHandlerContext]
  );
  const dispatch = (0, import_data.useDispatch)();
  const prepareHandlers = [];
  const valueHandlers = [];
  const changeHandlers = [];
  const dependencies = [];
  for (const key in keyedSelected) {
    dependencies.push(keyedSelected[key]);
  }
  formatTypes.forEach((type) => {
    if (type.__experimentalCreatePrepareEditableTree && __unstableFormatTypeHandlerContext) {
      const handler = type.__experimentalCreatePrepareEditableTree(
        getPrefixedSelectKeys(keyedSelected, type.name),
        __unstableFormatTypeHandlerContext
      );
      if (type.__experimentalCreateOnChangeEditableValue) {
        valueHandlers.push(handler);
      } else {
        prepareHandlers.push(handler);
      }
    }
    if (type.__experimentalCreateOnChangeEditableValue && __unstableFormatTypeHandlerContext) {
      let dispatchers = {};
      if (type.__experimentalGetPropsForEditableTreeChangeHandler) {
        dispatchers = type.__experimentalGetPropsForEditableTreeChangeHandler(
          dispatch,
          __unstableFormatTypeHandlerContext
        );
      }
      const selected = getPrefixedSelectKeys(keyedSelected, type.name);
      changeHandlers.push(
        type.__experimentalCreateOnChangeEditableValue(
          {
            ...typeof selected === "object" ? selected : {},
            ...dispatchers
          },
          __unstableFormatTypeHandlerContext
        )
      );
    }
  });
  return {
    formatTypes,
    prepareHandlers,
    valueHandlers,
    changeHandlers,
    dependencies
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useFormatTypes
});
//# sourceMappingURL=use-format-types.cjs.map
