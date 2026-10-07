import { useTooltip } from '@visx/tooltip';
import { useCallback, useRef, useState } from 'react';
import { useKeyboardNavigation } from '../../../components/tooltip';
import type { DataPointPercentageCalculated } from '../../../types';
import type { MouseEvent } from 'react';

interface UsePieKeyboardNavigationProps {
	/** Number of visible segments. Indexes run over them in `orderArcsForNavigation` order. */
	segmentCount: number;
	withTooltips: boolean;
	tooltipOffsetX: number;
	tooltipOffsetY: number;
}

export const usePieKeyboardNavigation = ( {
	segmentCount,
	withTooltips,
	tooltipOffsetX,
	tooltipOffsetY,
}: UsePieKeyboardNavigationProps ) => {
	const chartRef = useRef< HTMLDivElement >( null );
	const svgRef = useRef< SVGSVGElement >( null );
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
	const [ isNavigating, setIsNavigating ] = useState( false );
	const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
		useTooltip< DataPointPercentageCalculated >();

	const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown, onChartPointerMove } =
		useKeyboardNavigation( {
			selectedIndex,
			setSelectedIndex,
			isNavigating,
			setIsNavigating,
			chartRef,
			totalPoints: segmentCount,
		} );

	const getSegmentHandlers = ( data: DataPointPercentageCalculated, navigationIndex: number ) => ( {
		onMouseMove: ( event: MouseEvent< SVGElement > ) => {
			onChartPointerMove( navigationIndex );
			if ( ! withTooltips ) {
				return;
			}

			// The tooltip renders inside `chartRef`, so pointer coordinates are taken relative to it.
			const bounds = chartRef.current?.getBoundingClientRect();
			if ( ! bounds ) {
				return;
			}

			showTooltip( {
				tooltipData: data,
				tooltipLeft: event.clientX - bounds.left + tooltipOffsetX,
				tooltipTop: event.clientY - bounds.top + tooltipOffsetY,
			} );
		},
		onMouseLeave: withTooltips ? hideTooltip : undefined,
	} );

	/**
	 * Places the keyboard tooltip at `point`, an offset from the origin of the group the arcs are drawn in.
	 *
	 * @param originX - The group's x in SVG coordinates.
	 * @param originY - The group's y in SVG coordinates.
	 * @param point   - The point relative to the group, such as an arc centroid.
	 * @return The position inside `chartRef`, or undefined without tooltips or before mount.
	 */
	const getKeyboardTooltipPosition = useCallback(
		( originX: number, originY: number, [ x, y ]: [ number, number ] ) => {
			const chartBounds = chartRef.current?.getBoundingClientRect();
			const svgBounds = svgRef.current?.getBoundingClientRect();
			if ( ! withTooltips || ! chartBounds || ! svgBounds ) {
				return undefined;
			}
			return {
				left: svgBounds.left - chartBounds.left + originX + x + tooltipOffsetX,
				top: svgBounds.top - chartBounds.top + originY + y + tooltipOffsetY,
			};
		},
		[ withTooltips, tooltipOffsetX, tooltipOffsetY ]
	);

	return {
		chartRef,
		svgRef,
		selectedIndex,
		getSegmentHandlers,
		getKeyboardTooltipPosition,
		outputProps: {
			withTooltips,
			selectedIndex,
			tooltipRef,
			pointerTooltip: tooltipOpen
				? { data: tooltipData, left: tooltipLeft || 0, top: tooltipTop || 0 }
				: undefined,
		},
		chartProps: {
			role: 'application',
			tabIndex: 0,
			onKeyDown: onChartKeyDown,
			onFocus: onChartFocus,
			onBlur: onChartBlur,
		} as const,
	};
};
