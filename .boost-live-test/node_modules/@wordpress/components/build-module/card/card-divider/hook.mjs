// packages/components/src/card/card-divider/hook.ts
import { useMemo } from "@wordpress/element";
import { useContextSystem } from "../../context/index.mjs";
import * as styles from "../styles.mjs";
import { useCx } from "../../utils/hooks/use-cx.mjs";
function useCardDivider(props) {
  const {
    className,
    ...otherProps
  } = useContextSystem(props, "CardDivider");
  const cx = useCx();
  const classes = useMemo(() => cx(
    styles.Divider,
    styles.borderColor,
    // This classname is added for legacy compatibility reasons.
    "components-card__divider",
    className
  ), [className, cx]);
  return {
    ...otherProps,
    className: classes
  };
}
export {
  useCardDivider
};
//# sourceMappingURL=hook.mjs.map
