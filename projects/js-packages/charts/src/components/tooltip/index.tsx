import { TooltipWithBounds, useTooltip, withTooltip } from '@visx/tooltip';
import type { TooltipProps } from './types';

/**
 * Renders tooltip content with positioning based on hover state.
 *
 * @param {TooltipProps} props - Component props
 * @return {JSX.Element|null} Rendered tooltip or null
 */
const TooltipContent = ( { data }: TooltipProps ) => {
	const { tooltipData, tooltipLeft, tooltipTop } = useTooltip();

	return (
		tooltipData && (
			<TooltipWithBounds top={ tooltipTop } left={ tooltipLeft }>
				{ data.label }: { data.value }
			</TooltipWithBounds>
		)
	);
};

export const Tooltip = withTooltip( TooltipContent );
