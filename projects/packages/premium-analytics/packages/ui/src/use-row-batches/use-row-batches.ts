/**
 * External dependencies
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// `usePostThumbnails` queries a batch at a time, so change its `ROWS_PER_QUERY` with this.
export const ROW_BATCH_SIZE = 50;

// Matches the distance DataViews' own infinite scroll loads ahead at.
const GROW_THRESHOLD_PX = 600;

export type RowBatches = {
	/** How many leading rows to hand DataViews. */
	rowLimit: number;
	/** Goes on the element wrapping DataViews, whose bottom edge is where the mounted rows end. */
	ref: ( element: HTMLElement | null ) => void;
};

/**
 * Whether the mounted rows end close enough to the bottom of the window to mount the next batch.
 *
 * @param root - The element wrapping DataViews.
 * @return True near the end.
 */
function isNearEnd( root: Element ): boolean {
	const { bottom, height } = root.getBoundingClientRect();
	// A hidden table measures zero, and filling it would mount every row.
	return height > 0 && bottom - window.innerHeight <= GROW_THRESHOLD_PX;
}

/**
 * Mount a DataViews table's rows a batch at a time, growing as the page scrolls toward their end.
 * Unlike DataViews' infinite scroll, rows stay a plain prefix of the ordered list.
 *
 * @param rowCount  - How many rows the table could show.
 * @param resetKey  - A new value starts over from the first batch, with the table's top in view.
 * @param isLoading - The `isLoading` handed to DataViews, which shows its previous rows meanwhile.
 * @return The row limit and the ref for the element wrapping DataViews.
 */
export function useRowBatches(
	rowCount: number,
	resetKey: string | number,
	isLoading = false
): RowBatches {
	const [ batches, setBatches ] = useState( { resetKey, rowLimit: ROW_BATCH_SIZE } );
	let { rowLimit } = batches;
	if ( ! Object.is( batches.resetKey, resetKey ) ) {
		setBatches( { resetKey, rowLimit: ROW_BATCH_SIZE } );
		rowLimit = ROW_BATCH_SIZE;
	}

	const rowCountRef = useRef( rowCount );
	rowCountRef.current = rowCount;
	// Rows added while DataViews still shows its previous ones never reach the screen, so the
	// table stays near its end and the fill below would grow every remaining row at once.
	const isLoadingRef = useRef( isLoading );
	isLoadingRef.current = isLoading;
	const [ root, setRoot ] = useState< HTMLElement | null >( null );

	const grow = useCallback( () => {
		if ( isLoadingRef.current ) {
			return;
		}
		setBatches( current =>
			current.rowLimit < rowCountRef.current
				? { ...current, rowLimit: current.rowLimit + ROW_BATCH_SIZE }
				: current
		);
	}, [] );

	useEffect( () => {
		if ( ! root ) {
			return;
		}
		const handleScroll = () => {
			if ( isNearEnd( root ) ) {
				grow();
			}
		};
		// Scroll does not bubble, so capture it from whichever ancestor scrolls.
		window.addEventListener( 'scroll', handleScroll, { capture: true, passive: true } );
		window.addEventListener( 'resize', handleScroll );
		return () => {
			window.removeEventListener( 'scroll', handleScroll, { capture: true } );
			window.removeEventListener( 'resize', handleScroll );
		};
	}, [ root, grow ] );

	// Scrolled past the table, the first rows of a new order would sit out of view above.
	useLayoutEffect( () => {
		if ( root && root.getBoundingClientRect().top < 0 ) {
			root.scrollIntoView( { block: 'start' } );
		}
	}, [ root, resetKey ] );

	// Rows that end above the threshold never fire a scroll, so keep filling.
	useLayoutEffect( () => {
		if ( root && isNearEnd( root ) ) {
			grow();
		}
	}, [ root, rowLimit, rowCount, isLoading, grow ] );

	return { rowLimit, ref: setRoot };
}
