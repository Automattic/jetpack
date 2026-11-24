/**
 * External dependencies
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Allow for fractional pixel rounding when measuring row bounds. */
export const SUBPIXEL_TOLERANCE = 0.5;

/**
 * Counts how many leading roster rows fit inside the roster root.
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
		const root = list?.parentElement;
		if ( ! list || ! root ) {
			return;
		}

		const rows = list.querySelectorAll< HTMLElement >( ':scope > [data-roster-row]' );
		const rootRect = root.getBoundingClientRect();

		// Show every row while there is no laid-out roster to measure against,
		// rather than reporting that nothing fits and hiding the lot.
		if ( rows.length === 0 || rootRect.height <= 0 ) {
			setFittedCount( rowCount );
			return;
		}

		const limit = rootRect.bottom + SUBPIXEL_TOLERANCE;
		let fits = 0;
		while ( fits < rows.length && rows[ fits ].getBoundingClientRect().bottom <= limit ) {
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
		const root = listRef.current?.parentElement;
		if ( ! enabled || ! root || typeof ResizeObserver === 'undefined' ) {
			return;
		}

		// Row height is fixed, so only the roster's own box can affect the fit.
		const observer = new ResizeObserver( measure );
		observer.observe( root );

		return () => observer.disconnect();
	}, [ enabled, measure ] );

	return { listRef, fittedCount: enabled ? fittedCount : rowCount };
}
