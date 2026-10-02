/**
 * External dependencies
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { useElementSize } from '../../hooks/use-element-size';

/**
 * How a metric tile grid arranges its tiles; see `pickMetricTileLayout`.
 */
export type MetricTileLayout = 'compact' | 'stacked' | 'row' | 'grid';

// Below this a widget outside a dashboard grid (Storybook, a fixed page) is
// treated as one column wide.
const WIDE_MIN_INLINE_SIZE = 380;
// The list stretches only when each row gets at least this much height.
const STACKED_MIN_ROW_BLOCK_SIZE = 68;
// A grid tile at its shortest: padding-lg above and below, the label's
// line-height-sm, gap-sm, and the value's font-size-2xl at line-height 1.
const GRID_MIN_ROW_BLOCK_SIZE = 16 * 2 + 20 + 8 + 32;
// gap-md, between grid rows.
const GRID_ROW_GAP = 12;

type MetricTileLayoutInput = {
	width: number;
	height: number;
	tileCount: number;
	/**
	 * Dashboard columns the widget spans; `null` outside a dashboard grid.
	 */
	columnSpan: number | null;
};

/**
 * Picks the layout for a widget body, as the design prototype does: a
 * one-column widget is a list, `stacked` when each row has room and `compact`
 * (scrolling) when not; a wider widget is a `row` of centered tiles, or a
 * two-column `grid` once the body is tall enough for every tile row.
 */
export function pickMetricTileLayout( {
	width,
	height,
	tileCount,
	columnSpan,
}: MetricTileLayoutInput ): MetricTileLayout {
	const isWide = columnSpan === null ? width >= WIDE_MIN_INLINE_SIZE : columnSpan > 1;

	if ( ! isWide ) {
		return height / tileCount >= STACKED_MIN_ROW_BLOCK_SIZE ? 'stacked' : 'compact';
	}

	const gridRows = Math.ceil( tileCount / 2 );
	const gridBlockSize = GRID_MIN_ROW_BLOCK_SIZE * gridRows + GRID_ROW_GAP * ( gridRows - 1 );
	return height >= gridBlockSize ? 'grid' : 'row';
}

const SPAN_PATTERN = /^span (\d+)$/;

/**
 * Reads the column span of the dashboard grid item containing `element`. A 2D
 * grid item carries `grid-column-end: span N`; a lanes item carries the
 * shorthand, which computes onto the start longhand, so both are read.
 */
export function readColumnSpan( element: Element ): number | null {
	for ( let node = element.parentElement; node; node = node.parentElement ) {
		const { gridColumnEnd, gridColumnStart } = window.getComputedStyle( node );
		const match = SPAN_PATTERN.exec( gridColumnEnd ) ?? SPAN_PATTERN.exec( gridColumnStart );
		if ( match ) {
			return Number( match[ 1 ] );
		}
	}
	return null;
}

/**
 * Tracks the element's rendered size and its widget's column span, and returns
 * the layout that fits. The ref goes on the box the tiles must fit inside.
 *
 * @return A tuple of a ref callback and the current layout.
 */
export function useMetricTileLayout< T extends HTMLElement >( tileCount: number ) {
	const elementRef = useRef< T | null >( null );
	const [ setSizeRef, size ] = useElementSize< T >();
	const [ layout, setLayout ] = useState< MetricTileLayout >( 'stacked' );

	const ref = useCallback(
		( element: T | null ) => {
			elementRef.current = element;
			setSizeRef( element );
		},
		[ setSizeRef ]
	);

	// A span change always moves the width, so re-reading the span on every size
	// change is enough to follow a widget being resized on the dashboard.
	useLayoutEffect( () => {
		const element = elementRef.current;
		setLayout(
			pickMetricTileLayout( {
				width: size.width,
				height: size.height,
				tileCount,
				columnSpan: element ? readColumnSpan( element ) : null,
			} )
		);
	}, [ size, tileCount ] );

	return [ ref, layout ] as const;
}
