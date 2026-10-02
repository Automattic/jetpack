// packages/components/src/form-token-field/suggestions-list.tsx
import clsx from "clsx";
import { useRefEffect } from "@wordpress/compose";
import { __ } from "@wordpress/i18n";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
  const listRef = useRefEffect((listNode) => {
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
  return /* @__PURE__ */ _jsxs("ul", {
    ref: listRef,
    className: "components-form-token-field__suggestions-list",
    id: `components-form-token-suggestions-${instanceId}`,
    role: "listbox",
    children: [suggestions.map((suggestion, index) => {
      const matchText = computeSuggestionMatch(suggestion);
      const isSelected = index === selectedIndex;
      const isDisabled = typeof suggestion === "object" && suggestion?.disabled;
      const key = typeof suggestion === "object" && "value" in suggestion ? suggestion?.value : displayTransform(suggestion);
      const className = clsx("components-form-token-field__suggestion", {
        "is-selected": isSelected
      });
      let output;
      if (typeof __experimentalRenderItem === "function") {
        output = __experimentalRenderItem({
          item: suggestion
        });
      } else if (matchText) {
        output = /* @__PURE__ */ _jsxs("span", {
          "aria-label": displayTransform(suggestion),
          children: [matchText.suggestionBeforeMatch, /* @__PURE__ */ _jsx("strong", {
            className: "components-form-token-field__suggestion-match",
            children: matchText.suggestionMatch
          }), matchText.suggestionAfterMatch]
        });
      } else {
        output = displayTransform(suggestion);
      }
      return /* @__PURE__ */ _jsx("li", {
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
    }), suggestions.length === 0 && /* @__PURE__ */ _jsx("li", {
      className: "components-form-token-field__suggestion is-empty",
      children: __("No items found")
    })]
  });
}
var suggestions_list_default = SuggestionsList;
export {
  SuggestionsList,
  suggestions_list_default as default
};
//# sourceMappingURL=suggestions-list.mjs.map
