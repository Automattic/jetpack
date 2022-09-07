export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type Position =
	| 'top left'
	| 'top center'
	| 'top right'
	| 'bottom left'
	| 'bottom center'
	| 'bottom right';

export type IconTooltipProps = {
	position?: Position;
	placement?: Placement;
	animate?: false | true;
	iconCode?: string;
	title?: string;
	children?: React.ReactNode;
};
