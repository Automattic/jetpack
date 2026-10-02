import { FloatingTreeType } from "../../floating-ui-react/index.js";
interface Targets {
  currentTarget: HTMLElement | null;
  relatedTarget: HTMLElement | null;
}
interface Params {
  popupElement: HTMLElement | null;
  rootRef: React.RefObject<HTMLDivElement | null>;
  tree: FloatingTreeType | null;
  nodeId: string | undefined;
}
export declare function isOutsideMenuEvent({
  currentTarget,
  relatedTarget
}: Targets, params: Params): boolean;
export {};