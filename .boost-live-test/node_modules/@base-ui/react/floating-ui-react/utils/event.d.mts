export declare function stopEvent(event: Event | React.SyntheticEvent): void;
export declare function isReactEvent(event: any): event is React.SyntheticEvent;
export declare function isVirtualClick(event: MouseEvent | PointerEvent): boolean;
export declare function isVirtualPointerEvent(event: PointerEvent): boolean;
export declare function isMouseLikePointerType(pointerType: string | undefined, strict?: boolean): boolean;
export declare function isClickLikeEvent(event: Event | React.SyntheticEvent): boolean;