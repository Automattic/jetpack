import { TooltipWithBounds, useTooltip, withTooltip } from '@visx/tooltip';
import type { TooltipProps } from './types';

/**
 * Renders tooltip content with positioning based on hover state.
 *
 * @param {TooltipProps} props - Component props
 * @return {JSX.Element|null} Rendered tooltip or null
 */
const TooltipContent = ( {
	data,
	top = 0,
	left = 0,
}: TooltipProps & { top?: number; left?: number } ) => {
	// Try to get context values, but fall back to props if not available
	const tooltip = useTooltip();
	const tooltipTop = tooltip.tooltipTop ?? top;
	const tooltipLeft = tooltip.tooltipLeft ?? left;

	return (
		<TooltipWithBounds top={ tooltipTop } left={ tooltipLeft }>
			{ data.label }: { data.value }
		</TooltipWithBounds>
	);
};

export const Tooltip = withTooltip( TooltipContent );
