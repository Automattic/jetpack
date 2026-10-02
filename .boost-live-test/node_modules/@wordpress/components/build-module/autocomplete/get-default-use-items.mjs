// packages/components/src/autocomplete/get-default-use-items.tsx
import removeAccents from "remove-accents";
import { debounce } from "@wordpress/compose";
import { useLayoutEffect, useState } from "@wordpress/element";
import { escapeRegExp } from "../utils/strings.mjs";
function filterOptions(search, options = [], maxResults = 10) {
  const filtered = [];
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    let {
      keywords = []
    } = option;
    if ("string" === typeof option.label) {
      keywords = [...keywords, option.label];
    }
    const isMatch = keywords.some((keyword) => search.test(removeAccents(keyword)));
    if (!isMatch) {
      continue;
    }
    filtered.push(option);
    if (filtered.length === maxResults) {
      break;
    }
  }
  return filtered;
}
function getDefaultUseItems(autocompleter) {
  return (filterValue) => {
    const [items, setItems] = useState([]);
    useLayoutEffect(() => {
      const {
        options,
        isDebounced
      } = autocompleter;
      const loadOptions = debounce(() => {
        const promise2 = Promise.resolve(typeof options === "function" ? options(filterValue) : options).then((optionsData) => {
          if (promise2.canceled) {
            return;
          }
          const keyedOptions = optionsData.map((optionData, optionIndex) => ({
            key: `${autocompleter.name}-${optionIndex}`,
            value: optionData,
            label: autocompleter.getOptionLabel(optionData),
            keywords: autocompleter.getOptionKeywords ? autocompleter.getOptionKeywords(optionData) : [],
            isDisabled: autocompleter.isOptionDisabled ? autocompleter.isOptionDisabled(optionData) : false
          }));
          const search = new RegExp("(?:\\b|\\s|^)" + escapeRegExp(filterValue), "i");
          setItems(filterOptions(search, keyedOptions));
        });
        return promise2;
      }, isDebounced ? 250 : 0);
      const promise = loadOptions();
      return () => {
        loadOptions.cancel();
        if (promise) {
          promise.canceled = true;
        }
      };
    }, [filterValue]);
    return [items];
  };
}
export {
  getDefaultUseItems as default
};
//# sourceMappingURL=get-default-use-items.mjs.map
