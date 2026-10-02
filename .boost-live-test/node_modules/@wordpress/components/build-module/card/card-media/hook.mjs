// packages/components/src/card/card-media/hook.ts
import { useMemo } from "@wordpress/element";
import { useContextSystem } from "../../context/index.mjs";
import * as styles from "../styles.mjs";
import { useCx } from "../../utils/hooks/use-cx.mjs";
function useCardMedia(props) {
  const {
    className,
    ...otherProps
  } = useContextSystem(props, "CardMedia");
  const cx = useCx();
  const classes = useMemo(() => cx(
    styles.Media,
    styles.borderRadius,
    // This classname is added for legacy compatibility reasons.
    "components-card__media",
    className
  ), [className, cx]);
  return {
    ...otherProps,
    className: classes
  };
}
export {
  useCardMedia
};
//# sourceMappingURL=hook.mjs.map
