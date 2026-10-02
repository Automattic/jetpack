// packages/components/src/navigator/navigator-back-button/hook.ts
import { useCallback } from "@wordpress/element";
import { useContextSystem } from "../../context/index.mjs";
import Button from "../../button/index.mjs";
import { useNavigator } from "../use-navigator.mjs";
function useNavigatorBackButton(props) {
  const {
    onClick,
    as = Button,
    ...otherProps
  } = useContextSystem(props, "Navigator.BackButton");
  const {
    goBack
  } = useNavigator();
  const handleClick = useCallback((e) => {
    e.preventDefault();
    goBack();
    onClick?.(e);
  }, [goBack, onClick]);
  return {
    as,
    onClick: handleClick,
    ...otherProps
  };
}
export {
  useNavigatorBackButton
};
//# sourceMappingURL=hook.mjs.map
