export type Direction = 'top' | 'right' | 'bottom' | 'left' | 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft';
export type OnStartCallback = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, dir: Direction) => void;
export interface Props {
    direction: Direction;
    className?: string;
    replaceStyles?: React.CSSProperties;
    onResizeStart: OnStartCallback;
    children: React.ReactNode;
}
export declare const Resizer: import("react").MemoExoticComponent<(props: Props) => import("react/jsx-runtime").JSX.Element>;
