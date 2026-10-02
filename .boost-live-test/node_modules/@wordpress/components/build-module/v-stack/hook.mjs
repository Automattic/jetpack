// packages/components/src/v-stack/hook.ts
import { useContextSystem } from "../context/index.mjs";
import { useHStack } from "../h-stack/index.mjs";
function useVStack(props) {
  const {
    expanded = false,
    alignment = "stretch",
    ...otherProps
  } = useContextSystem(props, "VStack");
  const hStackProps = useHStack({
    direction: "column",
    expanded,
    alignment,
    ...otherProps
  });
  return hStackProps;
}
export {
  useVStack
};
//# sourceMappingURL=hook.mjs.map
