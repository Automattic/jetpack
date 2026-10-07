import { useTooltip } from '@visx/tooltip';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useKeyboardNavigation } from '../../../components/tooltip';
import type { DataPointPercentageCalculated } from '../../../types';
import type { FocusEvent, MouseEvent } from 'react';

interface UsePieKeyboardNavigationProps {
	/** Labels of the visible segments in `orderArcsForNavigation` order, which indexes run over. */
	segmentLabels: string[];
	withTooltips: boolean;
	tooltipOffsetX: number;
	tooltipOffsetY: number;
}

export const usePieKeyboardNavigation = ( {
	segmentLabels,
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

	const {
		tooltipRef: focusTooltip,
		onChartFocus,
		onChartBlur,
		onChartKeyDown,
		onChartPointerMove,
	} = useKeyboardNavigation( {
		selectedIndex,
		setSelectedIndex,
		isNavigating,
		setIsNavigating,
		chartRef,
		totalPoints: segmentLabels.length,
		visibleSeriesKey: JSON.stringify( segmentLabels ),
	} );

	const keyboardTooltip = useRef< HTMLDivElement | null >( null );
	const tooltipLostFocus = useRef( false );
	const isRestoringFocus = useRef( false );

	// React detaches the ref before removing the node, so the tooltip still holds focus here.
	const tooltipRef = useCallback(
		( element: HTMLDivElement | null ) => {
			if ( element ) {
				keyboardTooltip.current = element;
				focusTooltip( element );
			} else if (
				keyboardTooltip.current?.ownerDocument.activeElement === keyboardTooltip.current
			) {
				tooltipLostFocus.current = true;
			}
		},
		[ focusTooltip ]
	);

	// Arrow keys mount the next tooltip in the same commit, so focus only reaches the body when the selection's tooltip went away.
	useLayoutEffect( () => {
		if ( ! tooltipLostFocus.current ) {
			return;
		}
		tooltipLostFocus.current = false;
		const { activeElement, body } = chartRef.current?.ownerDocument ?? document;
		if ( activeElement === null || activeElement === body ) {
			isRestoringFocus.current = true;
			chartRef.current?.focus();
			isRestoringFocus.current = false;
		}
	} );

	// A browser that blurs a removed element has ended navigation, which would make this focus restart the selection at 0.
	const onFocus = useCallback(
		( event: FocusEvent< HTMLDivElement > ) => {
			if ( ! isRestoringFocus.current ) {
				onChartFocus( event );
			}
		},
		[ onChartFocus ]
	);

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
			onFocus,
			onBlur: onChartBlur,
		} as const,
	};
};
