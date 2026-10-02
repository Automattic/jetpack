type Touches = Array<Pick<Touch, 'identifier' | 'clientX' | 'clientY'>>;
export declare function createTouches(touches: Touches): {
  changedTouches: Touch[];
};
export declare function getHorizontalSliderRect(width?: number): DOMRect;
export {};