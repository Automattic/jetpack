type Undo = () => void;
interface MarkOthersOptions {
  ariaHidden?: boolean | undefined;
  inert?: boolean | undefined;
  mark?: boolean | undefined;
}
export declare function markOthers(avoidElements: Element[], options?: MarkOthersOptions): Undo;
export {};