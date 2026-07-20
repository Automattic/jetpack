import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Fractional layout rounding can put a row's bottom a hair past the container's
 * without any visible clipping. Allow that much slack before hiding a row.
 */
const SUBPIXEL_TOLERANCE = 0.5;

/**
 * Counts how many leading rows fit inside the content container.
 *
 * Rows are read from the DOM rather than derived from constants: row height
 * depends on the theme's row gap, label wrapping, and whatever a caller renders
 * as a label, so any restated number would drift.
 *
 * A row's cells are marked with `data-row-index`. An interactive row is a single
 * button carrying the index, a non-interactive row is two bare grid cells
 * sharing it, so cells are grouped by index and the group's lowest edge is taken
 * as the row's bottom.
 *
 * @param enabled  - Whether to measure at all. When false every row fits.
 * @param rowCount - Total number of rows rendered.
 * @return Ref for the content container and the number of leading rows that fit.
 */
export function useFittedRowCount( enabled: boolean, rowCount: number ) {
	const contentRef = useRef< HTMLDivElement | null >( null );
	const [ fittedCount, setFittedCount ] = useState( rowCount );

	const measure = useCallback( () => {
		const content = contentRef.current;
		if ( ! content ) {
			return;
		}

		// content > grid > rows. Selecting the grid's direct children matters:
		// an interactive row's cells are nested inside its button and carry the
		// same index, and counting them as rows would still produce the right
		// total — a correct answer arrived at by accident.
		const cells = content.querySelectorAll< HTMLElement >( ':scope > * > [data-row-index]' );

		const rowBottoms: number[] = [];
		cells.forEach( cell => {
			const index = Number( cell.getAttribute( 'data-row-index' ) );
			const { bottom } = cell.getBoundingClientRect();
			rowBottoms[ index ] = Math.max( rowBottoms[ index ] ?? -Infinity, bottom );
		} );

		const contentBottom = content.getBoundingClientRect().bottom + SUBPIXEL_TOLERANCE;

		let fits = 0;
		while ( fits < rowBottoms.length && rowBottoms[ fits ] <= contentBottom ) {
			fits++;
		}

		// Bail before setState: visibility changes preserve geometry, so this
		// should never re-trigger the observers, but setState inside a
		// ResizeObserver callback is the usual way this grows a render loop.
		setFittedCount( current => ( current === fits ? current : fits ) );
	}, [] );

	useLayoutEffect( () => {
		if ( ! enabled ) {
			setFittedCount( rowCount );
			return;
		}

		measure();

		const content = contentRef.current;
		if ( ! content ) {
			return;
		}

		const observer = new ResizeObserver( measure );
		// The container catches tile resizing; the grid catches font, image,
		// theme, or label changes that alter row geometry on an unchanged tile.
		observer.observe( content );
		if ( content.firstElementChild ) {
			observer.observe( content.firstElementChild );
		}

		return () => observer.disconnect();
	}, [ enabled, rowCount, measure ] );

	return { contentRef, fittedCount: enabled ? fittedCount : rowCount };
}
