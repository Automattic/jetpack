import { TooltipWithBounds, useTooltip } from '@visx/tooltip';

const Tooltip = ( { data }: { data: any } ) => {
	const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip();

	return (
		tooltipData && (
			<TooltipWithBounds top={ tooltipTop } left={ tooltipLeft }>
				{ data.label }: { data.value }
			</TooltipWithBounds>
		)
	);
};

export default Tooltip;
