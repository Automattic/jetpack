"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/form-token-field/suggestions-list.tsx
var suggestions_list_exports = {};
__export(suggestions_list_exports, {
  SuggestionsList: () => SuggestionsList,
  default: () => suggestions_list_default
});
module.exports = __toCommonJS(suggestions_list_exports);
var import_clsx = __toESM(require("clsx"));
var import_compose = require("@wordpress/compose");
var import_i18n = require("@wordpress/i18n");
var import_jsx_runtime = require("react/jsx-runtime");
var handleMouseDown = (e) => {
  e.preventDefault();
};
function SuggestionsList({
  selectedIndex,
  scrollIntoView,
  match,
  onHover,
  onSelect,
  suggestions = [],
  displayTransform,
  instanceId,
  __experimentalRenderItem
}) {
  const listRef = (0, import_compose.useRefEffect)((listNode) => {
    if (selectedIndex > -1 && scrollIntoView && listNode.children[selectedIndex]) {
      listNode.children[selectedIndex].scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [selectedIndex, scrollIntoView]);
  const handleHover = (suggestion) => {
    return () => {
      onHover?.(suggestion);
    };
  };
  const handleClick = (suggestion) => {
    return () => {
      onSelect?.(suggestion);
    };
  };
  const computeSuggestionMatch = (suggestion) => {
    const matchText = displayTransform(match).normalize("NFKC").toLocaleLowerCase();
    if (matchText.length === 0) {
      return null;
    }
    const transformedSuggestion = displayTransform(suggestion);
    const indexOfMatch = transformedSuggestion.normalize("NFKC").toLocaleLowerCase().indexOf(matchText);
    return {
      suggestionBeforeMatch: transformedSuggestion.substring(0, indexOfMatch),
      suggestionMatch: transformedSuggestion.substring(indexOfMatch, indexOfMatch + matchText.length),
      suggestionAfterMatch: transformedSuggestion.substring(indexOfMatch + matchText.length)
    };
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
    ref: listRef,
    className: "components-form-token-field__suggestions-list",
    id: `components-form-token-suggestions-${instanceId}`,
    role: "listbox",
    children: [suggestions.map((suggestion, index) => {
      const matchText = computeSuggestionMatch(suggestion);
      const isSelected = index === selectedIndex;
      const isDisabled = typeof suggestion === "object" && suggestion?.disabled;
      const key = typeof suggestion === "object" && "value" in suggestion ? suggestion?.value : displayTransform(suggestion);
      const className = (0, import_clsx.default)("components-form-token-field__suggestion", {
        "is-selected": isSelected
      });
      let output;
      if (typeof __experimentalRenderItem === "function") {
        output = __experimentalRenderItem({
          item: suggestion
        });
      } else if (matchText) {
        output = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
          "aria-label": displayTransform(suggestion),
          children: [matchText.suggestionBeforeMatch, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
            className: "components-form-token-field__suggestion-match",
            children: matchText.suggestionMatch
          }), matchText.suggestionAfterMatch]
        });
      } else {
        output = displayTransform(suggestion);
      }
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
        id: `components-form-token-suggestions-${instanceId}-${index}`,
        role: "option",
        className,
        onMouseDown: handleMouseDown,
        onClick: handleClick(suggestion),
        onMouseEnter: handleHover(suggestion),
        "aria-selected": index === selectedIndex,
        "aria-disabled": isDisabled,
        children: output
      }, key);
    }), suggestions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
      className: "components-form-token-field__suggestion is-empty",
      children: (0, import_i18n.__)("No items found")
    })]
  });
}
var suggestions_list_default = SuggestionsList;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SuggestionsList
});
//# sourceMappingURL=suggestions-list.cjs.map
