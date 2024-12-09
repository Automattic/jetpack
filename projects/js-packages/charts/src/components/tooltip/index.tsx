import type { TooltipProps } from './types';

const tooltipStyles = {
	padding: '0.5rem',
	backgroundColor: 'rgba(0,0,0,0.85)',
	color: 'white',
	borderRadius: '4px',
	fontSize: '14px',
	boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
};

export const Tooltip = ( {
	data,
	top,
	left,
	style = {},
}: TooltipProps & {
	top: number;
	left: number;
	style?: React.CSSProperties;
} ) => {
	return (
		<div
			style={ {
				position: 'absolute',
				top,
				left,
				...tooltipStyles,
				...style,
			} }
		>
			{ data.label }: { data.value }
		</div>
	);
};
