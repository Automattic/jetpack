import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import type { TooltipProps } from './types';

export const Tooltip = ( { data }: TooltipProps ) => {
	const { tooltipData, tooltipLeft, tooltipTop } = useTooltip();

	return (
		tooltipData && (
			<TooltipWithBounds top={ tooltipTop } left={ tooltipLeft }>
				{ data.label }: { data.value }
			</TooltipWithBounds>
		)
	);
};
