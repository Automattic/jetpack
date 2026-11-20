import { useTooltip } from '@visx/tooltip';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useKeyboardNavigation } from '../../../components/tooltip';
import { formatDataPointValue } from '../../../utils';
import type { DataPointPercentageCalculated } from '../../../types';
import type { LegendValueDisplay } from '../../../utils';
import type { MouseEvent } from 'react';

interface UsePieKeyboardNavigationProps< Arc > {
	/** The visible arcs in `orderArcsForNavigation` order, which indexes run over. */
	navigationArcs: Arc[];
	withTooltips: boolean;
	tooltipOffsetX: number;
	tooltipOffsetY: number;
	/** Which figure a segment's accessible name states, as the legend states it. */
	legendValueDisplay: LegendValueDisplay;
}

export const usePieKeyboardNavigation = < Arc extends { data: DataPointPercentageCalculated } >( {
	navigationArcs,
	withTooltips,
	tooltipOffsetX,
	tooltipOffsetY,
	legendValueDisplay,
}: UsePieKeyboardNavigationProps< Arc > ) => {
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
		totalPoints: navigationArcs.length,
		visibleSeriesKey: JSON.stringify( navigationArcs.map( arcDatum => arcDatum.data.label ) ),
	} );

	const selectedArc = selectedIndex === undefined ? undefined : navigationArcs[ selectedIndex ];

	const keyboardTooltip = useRef< HTMLDivElement | null >( null );
	const tooltipLostFocus = useRef( false );

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
			chartRef.current?.focus();
		}
	} );

	// Without a name of its own an arc reaches no accessibility tree, leaving the application
	// container empty and screen readers with nothing to read or move into.
	const getSegmentName = ( data: DataPointPercentageCalculated ) => {
		const value = formatDataPointValue( data, legendValueDisplay );

		return value
			? sprintf(
					/* translators: 1: segment name, e.g. "Desktop". 2: its share or value, e.g. "23%". */
					__( '%1$s: %2$s', 'jetpack-charts' ),
					data.label,
					value
				)
			: data.label;
	};

	const getSegmentProps = ( data: DataPointPercentageCalculated, navigationIndex: number ) => ( {
		role: 'img',
		'aria-label': getSegmentName( data ),
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
	 * Anchors the keyboard tooltip at `point`, an offset from the origin of the group the arcs are drawn in.
	 *
	 * @param originX - The group's x in SVG coordinates.
	 * @param originY - The group's y in SVG coordinates.
	 * @param point   - The point relative to the group, such as an arc centroid.
	 * @return The anchor in SVG coordinates, or undefined without tooltips.
	 */
	const getKeyboardTooltipAnchor = useCallback(
		( originX: number, originY: number, [ x, y ]: [ number, number ] ) =>
			withTooltips
				? { left: originX + x + tooltipOffsetX, top: originY + y + tooltipOffsetY }
				: undefined,
		[ withTooltips, tooltipOffsetX, tooltipOffsetY ]
	);

	return {
		chartRef,
		svgRef,
		selectedArc,
		getSegmentProps,
		getKeyboardTooltipAnchor,
		selectionOutputProps: {
			withTooltips,
			selectedIndex,
			selectedData: selectedArc?.data,
			chartRef,
			svgRef,
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
