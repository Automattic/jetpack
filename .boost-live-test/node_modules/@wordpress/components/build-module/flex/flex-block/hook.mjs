// packages/components/src/flex/flex-block/hook.ts
import { useContextSystem } from "../../context/index.mjs";
import { useFlexItem } from "../flex-item/index.mjs";
function useFlexBlock(props) {
  const otherProps = useContextSystem(props, "FlexBlock");
  const flexItemProps = useFlexItem({
    isBlock: true,
    ...otherProps
  });
  return flexItemProps;
}
export {
  useFlexBlock
};
//# sourceMappingURL=hook.mjs.map
