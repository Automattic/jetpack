import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Fractional layout rounding can put a row's bottom a hair past the container's
 * without any visible clipping. Allow that much slack before hiding a row.
 *
 * Exported so tests assert against the real tolerance rather than restating it.
 */
export const SUBPIXEL_TOLERANCE = 0.5;

/**
 * Counts how many leading roster rows fit inside the list container.
 *
 * Rows are read from the DOM rather than derived from a row-height constant:
 * padding, avatar size, and the host theme's spacing tokens all feed the real
 * height, so any restated number would drift from the stylesheet.
 *
 * Mirrors `useFittedRowCount` in `@automattic/charts` (which backs
 * `LeaderboardChart`'s `fitRows`), minus its grid-specific selector — a roster
 * is a plain column of rows marked with `data-roster-row`.
 *
 * @param enabled  - Whether to measure at all. When false every row fits.
 * @param rowCount - Total number of rows rendered.
 * @return Ref for the list container and the number of leading rows that fit.
 */
export function useFittedRosterRows( enabled: boolean, rowCount: number ) {
	const listRef = useRef< HTMLDivElement | null >( null );
	const [ fittedCount, setFittedCount ] = useState( rowCount );

	const measure = useCallback( () => {
		const list = listRef.current;
		if ( ! list ) {
			return;
		}

		const rows = list.querySelectorAll< HTMLElement >( ':scope > [data-roster-row]' );

		// Fail open. If the rows cannot be measured — a changed DOM shape, a
		// detached container — showing every row keeps the data reachable, where
		// hiding all of them reads as a broken tile.
		if ( rows.length === 0 ) {
			setFittedCount( rowCount );
			return;
		}

		const listBottom = list.getBoundingClientRect().bottom + SUBPIXEL_TOLERANCE;

		let fits = 0;
		while ( fits < rows.length && rows[ fits ].getBoundingClientRect().bottom <= listBottom ) {
			fits++;
		}

		// Bail before setState: setState inside a ResizeObserver callback is the
		// usual way this grows a render loop.
		setFittedCount( current => ( current === fits ? current : fits ) );
	}, [ rowCount ] );

	useLayoutEffect( () => {
		if ( ! enabled ) {
			setFittedCount( rowCount );
			return;
		}

		measure();
	}, [ enabled, rowCount, measure ] );

	useLayoutEffect( () => {
		if ( ! enabled ) {
			return;
		}

		const list = listRef.current;
		if ( ! list ) {
			return;
		}

		// The container catches tile resizing; observing it alone is enough because
		// roster rows have a fixed height — the avatar sets it and both text spans
		// are single-line with ellipsis, so a row never reflows on its own.
		const observer = new ResizeObserver( measure );
		observer.observe( list );

		return () => observer.disconnect();
	}, [ enabled, rowCount, measure ] );

	return { listRef, fittedCount: enabled ? fittedCount : rowCount };
}
