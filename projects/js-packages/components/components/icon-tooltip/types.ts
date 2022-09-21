export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type Position =
	| 'top left'
	| 'top center'
	| 'top right'
	| 'bottom left'
	| 'bottom center'
	| 'bottom right';

export type IconTooltipProps = {
	className?: string;
	iconClassName?: string;
	position?: Position;
	placement?: Placement;
	animate?: boolean;
	iconCode?: string;
	title?: string;
	children?: React.ReactNode;
	iconSize?: number;
};
