import type { MenuRoot } from "../root/MenuRoot.mjs";
export interface MenuOpenEventDetails {
  open: boolean;
  reason: MenuRoot.ChangeEventReason | null;
  nodeId: string | undefined;
  parentNodeId: string | null;
}