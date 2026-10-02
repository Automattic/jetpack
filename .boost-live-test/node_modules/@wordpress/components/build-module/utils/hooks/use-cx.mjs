// packages/components/src/utils/hooks/use-cx.ts
import { __unsafe_useEmotionCache as useEmotionCache } from "@emotion/react";
import { insertStyles } from "@emotion/utils";
import { cx as innerCx } from "@emotion/css";
import { useCallback } from "@wordpress/element";
var isSerializedStyles = (o) => typeof o !== "undefined" && o !== null && ["name", "styles"].every((p) => typeof o[p] !== "undefined");
var useCx = () => {
  const cache = useEmotionCache();
  const cx = useCallback((...classNames) => {
    if (cache === null) {
      throw new Error("The `useCx` hook should be only used within a valid Emotion Cache Context");
    }
    return innerCx(...classNames.map((arg) => {
      if (isSerializedStyles(arg)) {
        insertStyles(cache, arg, false);
        return `${cache.key}-${arg.name}`;
      }
      return arg;
    }));
  }, [cache]);
  return cx;
};
export {
  useCx
};
//# sourceMappingURL=use-cx.mjs.map
