import { localPoint } from '@visx/event';
import { useTooltip } from '@visx/tooltip';
import { useCallback, type MouseEvent } from 'react';
import type { DataPoint } from '../types';

type UseChartMouseHandlerProps = {
	/**
	 * Whether tooltips are enabled
	 */
	withTooltips: boolean;
	/**
	 * Horizontal offset for tooltip positioning in pixels (default: 0)
	 */
	offsetX?: number;
	/**
	 * Vertical offset for tooltip positioning in pixels (default: -10)
	 */
	offsetY?: number;
};

type UseChartMouseHandlerReturn = {
	/**
	 * Handler for mouse move events
	 */
	onMouseMove: ( event: MouseEvent< SVGElement >, data: DataPoint ) => void;
	/**
	 * Handler for mouse leave events
	 */
	onMouseLeave: () => void;
	/**
	 * Whether the tooltip is currently open
	 */
	tooltipOpen: boolean;
	/**
	 * The current tooltip data
	 */
	tooltipData: DataPoint | null;
	/**
	 * The current tooltip left position
	 */
	tooltipLeft: number | undefined;
	/**
	 * The current tooltip top position
	 */
	tooltipTop: number | undefined;
};

/**
 * Hook to handle mouse interactions for chart components
 *
 * @param {UseChartMouseHandlerProps} props - Hook configuration
 * @return {UseChartMouseHandlerReturn} Object containing handlers and tooltip state
 */
export const useChartMouseHandler = ( {
	withTooltips,
	offsetX = 0,
	offsetY = -10,
}: UseChartMouseHandlerProps ): UseChartMouseHandlerReturn => {
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPoint >();

	const onMouseMove = useCallback(
		( event: MouseEvent< SVGElement >, data: DataPoint ) => {
			if ( ! withTooltips ) {
				return;
			}

			const coords = localPoint( event );
			if ( ! coords ) {
				return;
			}

			showTooltip( {
				tooltipData: data,
				tooltipLeft: coords.x + offsetX,
				tooltipTop: coords.y + offsetY,
			} );
		},
		[ withTooltips, showTooltip, offsetX, offsetY ]
	);

	const onMouseLeave = useCallback( () => {
		if ( ! withTooltips ) {
			return;
		}
		hideTooltip();
	}, [ withTooltips, hideTooltip ] );

	return {
		onMouseMove,
		onMouseLeave,
		tooltipOpen,
		tooltipData: tooltipData || null,
		tooltipLeft,
		tooltipTop,
	};
};
