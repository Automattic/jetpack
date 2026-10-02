import type { FloatingNodeType } from "../types.js";
export declare function getNodeChildren(nodes: Array<FloatingNodeType>, id: string | undefined, onlyOpenChildren?: boolean): Array<FloatingNodeType>;
export declare function getDeepestNode(nodes: Array<FloatingNodeType>, id: string | undefined): FloatingNodeType | undefined;
export declare function getNodeAncestors(nodes: Array<FloatingNodeType>, id: string | undefined): FloatingNodeType[];