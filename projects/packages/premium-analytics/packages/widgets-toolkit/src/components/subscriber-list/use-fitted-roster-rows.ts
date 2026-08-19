import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Allow for fractional pixel rounding when measuring row bounds. */
export const SUBPIXEL_TOLERANCE = 0.5;

/**
 * Counts how many leading roster rows fit inside the list container.
 *
 * Measures the DOM because row height depends on the rendered styles.
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

		// Show all rows if layout cannot be measured.
		if ( rows.length === 0 ) {
			setFittedCount( rowCount );
			return;
		}

		const listBottom = list.getBoundingClientRect().bottom + SUBPIXEL_TOLERANCE;

		let fits = 0;
		while ( fits < rows.length && rows[ fits ].getBoundingClientRect().bottom <= listBottom ) {
			fits++;
		}

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

		// Row height is fixed, so only container resizing can affect the fit.
		const observer = new ResizeObserver( measure );
		observer.observe( list );

		return () => observer.disconnect();
	}, [ enabled, rowCount, measure ] );

	return { listRef, fittedCount: enabled ? fittedCount : rowCount };
}
