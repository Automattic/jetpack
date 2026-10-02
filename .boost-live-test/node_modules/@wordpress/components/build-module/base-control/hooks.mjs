// packages/components/src/base-control/hooks.ts
import { useInstanceId } from "@wordpress/compose";
import BaseControl from "./index.mjs";
function useBaseControlProps(props) {
  const {
    help,
    id: preferredId,
    ...restProps
  } = props;
  const uniqueId = useInstanceId(BaseControl, "wp-components-base-control", preferredId);
  return {
    baseControlProps: {
      id: uniqueId,
      help,
      ...restProps
    },
    controlProps: {
      id: uniqueId,
      ...!!help ? {
        "aria-describedby": `${uniqueId}__help`
      } : {}
    }
  };
}
export {
  useBaseControlProps
};
//# sourceMappingURL=hooks.mjs.map
