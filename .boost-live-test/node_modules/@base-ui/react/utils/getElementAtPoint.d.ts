type ElementFromPointRoot = Node & Partial<Pick<Document, 'elementFromPoint'>>;
export declare function getElementAtPoint(root: ElementFromPointRoot | null | undefined, x: number, y: number): Element | null;
export {};