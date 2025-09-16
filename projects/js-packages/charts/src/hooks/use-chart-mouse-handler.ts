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
	 * Offset for tooltip positioning (in pixels).
	 * Can be a number for vertical offset only, or an object with x/y values.
	 * @default 5
	 */
	tooltipOffset?: number | { x?: number; y?: number };
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
	tooltipOffset = 5,
}: UseChartMouseHandlerProps ): UseChartMouseHandlerReturn => {
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPoint >();

	// Normalize offset to always have x and y values
	const normalizedOffset = useCallback( ( offset: typeof tooltipOffset ) => {
		if ( typeof offset === 'number' ) {
			return { x: 0, y: offset };
		}
		return { x: offset.x ?? 0, y: offset.y ?? 5 };
	}, [] );

	// TODO: either debounce/throttle or use useTooltipInPortal with built-in debounce
	const onMouseMove = useCallback(
		( event: MouseEvent< SVGElement >, data: DataPoint ) => {
			if ( ! withTooltips ) {
				return;
			}

			const coords = localPoint( event );
			if ( ! coords ) {
				return;
			}

			const offset = normalizedOffset( tooltipOffset );

			// Apply offset with basic boundary checking
			const tooltipX = coords.x + offset.x;
			const tooltipY = Math.max( 0, coords.y - offset.y );

			showTooltip( {
				tooltipData: data,
				tooltipLeft: tooltipX,
				tooltipTop: tooltipY,
			} );
		},
		[ withTooltips, showTooltip, tooltipOffset, normalizedOffset ]
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
