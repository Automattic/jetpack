import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Fractional layout rounding can put a row's bottom a hair past the container's
 * without any visible clipping. Allow that much slack before hiding a row.
 *
 * Exported so tests and stories assert against the real tolerance rather than
 * restating it.
 */
export const SUBPIXEL_TOLERANCE = 0.5;

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
 * @param data     - Rendered row data, whose geometry may change without changing the count.
 * @return Ref for the content container and the number of leading rows that fit.
 */
export function useFittedRowCount( enabled: boolean, rowCount: number, data: unknown ) {
	const contentRef = useRef< HTMLDivElement | null >( null );
	const [ fittedCount, setFittedCount ] = useState( rowCount );

	const measure = useCallback( () => {
		const content = contentRef.current;
		if ( ! content ) {
			return;
		}

		// Switching from the default scrollable mode can leave the content at a
		// non-zero scroll offset, which would shift every measurement below.
		content.scrollTop = 0;

		// Grid's direct children only: an interactive row's cells are nested
		// inside its button and repeat the same index.
		const cells = content.querySelectorAll< HTMLElement >( ':scope > * > [data-row-index]' );

		const rowBottoms: number[] = [];
		cells.forEach( cell => {
			const index = Number( cell.getAttribute( 'data-row-index' ) );
			// An unparseable index would write a non-numeric key, leaving a hole
			// that silently truncates the scan below at the preceding row.
			if ( ! Number.isInteger( index ) || index < 0 || index >= rowCount ) {
				return;
			}
			const { bottom } = cell.getBoundingClientRect();
			rowBottoms[ index ] = Math.max( rowBottoms[ index ] ?? -Infinity, bottom );
		} );

		// Fail open. If the rows cannot be measured at all — a changed DOM shape,
		// a detached container — falling back to the scrollable default keeps the
		// data reachable, where hiding every row reads as a broken tile.
		if ( rowBottoms.length === 0 ) {
			setFittedCount( rowCount );
			return;
		}

		const contentBottom = content.getBoundingClientRect().bottom + SUBPIXEL_TOLERANCE;

		let fits = 0;
		while ( fits < rowBottoms.length && rowBottoms[ fits ] <= contentBottom ) {
			fits++;
		}

		// Bail before setState: setState inside a ResizeObserver callback is the
		// usual way this grows a render loop.
		setFittedCount( current => ( current === fits ? current : fits ) );
	}, [ rowCount ] );

	// Measure after row data changes so geometry updates are caught even when the
	// row count and the grid's overall size stay the same (for example, one label
	// wraps while another unwraps after a same-length data update).
	useLayoutEffect( () => {
		if ( ! enabled ) {
			setFittedCount( rowCount );
			return;
		}

		measure();
	}, [ enabled, rowCount, data, measure ] );

	useLayoutEffect( () => {
		if ( ! enabled ) {
			return;
		}

		const content = contentRef.current;
		if ( ! content ) {
			return;
		}

		const observer = new ResizeObserver( measure );
		// The container catches tile resizing; the grid catches font, image,
		// theme, or label changes that alter row geometry on an unchanged tile.
		observer.observe( content );
		const grid = content.querySelector< HTMLElement >( ':scope > [data-leaderboard-grid]' );
		if ( grid ) {
			observer.observe( grid );
		}

		return () => observer.disconnect();
	}, [ enabled, rowCount, measure ] );

	return { contentRef, fittedCount: enabled ? fittedCount : rowCount };
}
