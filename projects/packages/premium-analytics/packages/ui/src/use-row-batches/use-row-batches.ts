/**
 * External dependencies
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './use-row-batches.module.scss';

export const ROW_BATCH_SIZE = 50;

// Matches the distance DataViews' own infinite scroll loads ahead at.
const GROW_THRESHOLD_PX = 600;
const CONTAINER_SELECTOR = '.dataviews-layout__container';

export type RowBatches = {
	/** How many leading rows to hand DataViews. */
	rowLimit: number;
	/** Spread onto the element wrapping DataViews: it caps the table's own scroll container. */
	containerProps: {
		ref: ( element: HTMLDivElement | null ) => void;
		className: string;
	};
};

/**
 * Whether a scroll container is close enough to its end to mount the next batch.
 *
 * @param container - DataViews' scroll container.
 * @return True near the end.
 */
function isNearEnd( container: Element ): boolean {
	return container.scrollTop + container.clientHeight >= container.scrollHeight - GROW_THRESHOLD_PX;
}

/**
 * Mount a DataViews table's rows a batch at a time, growing as its own scroll container nears
 * the end. Unlike DataViews' infinite scroll, rows stay a plain prefix of the ordered list.
 *
 * @param rowCount  - How many rows the table could show.
 * @param resetKey  - A new value starts over from the first batch, scrolled to the top.
 * @param isLoading - The `isLoading` handed to DataViews, which shows its previous rows meanwhile.
 * @return The row limit and the props for the element wrapping DataViews.
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
	// container stays near its end and the fill below would grow every remaining row at once.
	const isLoadingRef = useRef( isLoading );
	isLoadingRef.current = isLoading;
	const [ root, setRoot ] = useState< HTMLDivElement | null >( null );

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
		// Scroll does not bubble, so catch the container's own in the capture phase.
		const handleScroll = ( event: Event ) => {
			const target = event.target as Element;
			if ( target.matches?.( CONTAINER_SELECTOR ) && isNearEnd( target ) ) {
				grow();
			}
		};
		root.addEventListener( 'scroll', handleScroll, true );
		return () => root.removeEventListener( 'scroll', handleScroll, true );
	}, [ root, grow ] );

	useLayoutEffect( () => {
		const container = root?.querySelector( CONTAINER_SELECTOR );
		if ( container ) {
			container.scrollTop = 0;
		}
	}, [ root, resetKey ] );

	// Rows that do not overflow the container never fire a scroll, so keep filling it.
	useLayoutEffect( () => {
		const container = root?.querySelector( CONTAINER_SELECTOR );
		if ( container && container.clientHeight > 0 && isNearEnd( container ) ) {
			grow();
		}
	}, [ root, rowLimit, rowCount, isLoading, grow ] );

	return {
		rowLimit,
		containerProps: { ref: setRoot, className: styles.container },
	};
}
