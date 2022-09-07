export type IconTooltipProps = {
	position?:
		| 'top left'
		| 'top center'
		| 'top right'
		| 'bottom left'
		| 'bottom center'
		| 'bottom right';
	placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
	animate?: false | true;
	iconCode?: string;
	title?: string;
	children?: React.ReactNode;
};
