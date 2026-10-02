// packages/components/src/navigator/navigator-button/hook.ts
import { useCallback } from "@wordpress/element";
import { escapeAttribute } from "@wordpress/escape-html";
import { useContextSystem } from "../../context/index.mjs";
import Button from "../../button/index.mjs";
import { useNavigator } from "../use-navigator.mjs";
var cssSelectorForAttribute = (attrName, attrValue) => `[${attrName}="${attrValue}"]`;
function useNavigatorButton(props) {
  const {
    path,
    onClick,
    as = Button,
    attributeName = "id",
    ...otherProps
  } = useContextSystem(props, "Navigator.Button");
  const escapedPath = escapeAttribute(path);
  const {
    goTo
  } = useNavigator();
  const handleClick = useCallback((e) => {
    e.preventDefault();
    goTo(escapedPath, {
      focusTargetSelector: cssSelectorForAttribute(attributeName, escapedPath)
    });
    onClick?.(e);
  }, [goTo, onClick, attributeName, escapedPath]);
  return {
    as,
    onClick: handleClick,
    ...otherProps,
    [attributeName]: escapedPath
  };
}
export {
  useNavigatorButton
};
//# sourceMappingURL=hook.mjs.map
