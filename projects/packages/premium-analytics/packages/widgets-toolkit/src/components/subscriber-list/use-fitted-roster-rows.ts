/**
 * External dependencies
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Allow for fractional pixel rounding when measuring row bounds. */
export const SUBPIXEL_TOLERANCE = 0.5;

/**
 * Counts how many leading roster rows fit inside the roster.
 *
 * Measures the DOM because row height depends on the rendered styles.
 *
 * Measurement is taken against the roster root, not the list box: the "N more"
 * footer only exists once a row is hidden, so measuring the list would let the
 * result shrink the box it was measured from. That box is then bistable — a
 * tile that shrank and grew back would keep the footer and settle one row short
 * of where it started.
 *
 * @param enabled      - Whether to measure at all. When false every row fits.
 * @param rowCount     - Total number of rows rendered.
 * @param hasExtraRows - Whether rows beyond `rowCount` exist, so the footer
 *                     renders whatever the fit turns out to be.
 * @return Ref for the list container and the number of leading rows that fit.
 */
export function useFittedRosterRows( enabled: boolean, rowCount: number, hasExtraRows: boolean ) {
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

		const countFittingAbove = ( limit: number ) => {
			let fits = 0;
			while ( fits < rows.length && rows[ fits ].getBoundingClientRect().bottom <= limit ) {
				fits++;
			}
			return fits;
		};

		const rootBottom = rootRect.bottom + SUBPIXEL_TOLERANCE;

		// Every row fits with no footer to make room for, so the roster keeps the
		// full height. Deciding this against the root — never the list — is what
		// lets the footer disappear again when the tile grows back.
		const fits =
			! hasExtraRows && countFittingAbove( rootBottom ) === rows.length
				? rows.length
				: countFittingAbove( rootBottom - footerHeight( root ) );

		setFittedCount( current => ( current === fits ? current : fits ) );
	}, [ rowCount, hasExtraRows ] );

	// `fittedCount` is a dependency because mounting the footer changes the room
	// left for rows without resizing the root, so the observer never sees it.
	// This settles: the footer's height is the only geometry the fit feeds back
	// into, and the no-footer branch above is measured independently of it.
	useLayoutEffect( () => {
		if ( ! enabled ) {
			setFittedCount( rowCount );
			return;
		}

		measure();
	}, [ enabled, rowCount, fittedCount, measure ] );

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

/**
 * Height the "N more" footer takes from the rows, or zero before it mounts.
 *
 * @param root - The roster root element.
 * @return Footer height in pixels.
 */
function footerHeight( root: HTMLElement ) {
	const footer = root.querySelector< HTMLElement >( ':scope > [data-roster-footer]' );

	return footer?.getBoundingClientRect().height ?? 0;
}
