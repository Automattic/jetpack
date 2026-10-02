// packages/components/src/drop-zone/provider.ts
import deprecated from "@wordpress/deprecated";
function DropZoneProvider({
  children
}) {
  deprecated("wp.components.DropZoneProvider", {
    since: "5.8",
    hint: "wp.component.DropZone no longer needs a provider. wp.components.DropZoneProvider is safe to remove from your code."
  });
  return children;
}
export {
  DropZoneProvider as default
};
//# sourceMappingURL=provider.mjs.map
