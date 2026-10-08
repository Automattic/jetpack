import { wrapColumnGroups } from './column-groups';
import type { ColumnGroupLayout } from './column-groups';

export type CompactCellFitInput = {
	/** Width and height (px) the grid may take. */
	width: number;
	height: number;
	/** The unwrapped layout; every band count is tried through `wrapColumnGroups` on it. */
	layout: ColumnGroupLayout;
	rows: number;
	cellGap: number;
	groupGap: number;
	/** Label track and row sizes (px); null for a label row the grid does not draw. */
	rowLabelWidth: number;
	columnLabelHeight: number | null;
	groupLabelHeight: number | null;
	/** Smallest cell worth drawing; below it the grid stays on one band and overflows. */
	minCellSize: number;
};

export type CompactCellFit = { bands: number; cellSize: number };

/**
 * Largest whole-pixel square cell, and the band count giving it, for a compact grid in a box.
 *
 * @param input - The box, the grid's layout, and its fixed gaps and label sizes.
 * @return The fit; one band at `minCellSize` when no band count reaches it.
 */
export const fitCompactCells = ( input: CompactCellFitInput ): CompactCellFit => {
	const { width, height, layout, rows, cellGap, groupGap, minCellSize } = input;
	const columns = layout.columns.length;
	if ( columns === 0 || rows === 0 || width <= 0 || height <= 0 ) {
		return { bands: 1, cellSize: minCellSize };
	}

	const maxBands = Math.max( 1, layout.groups.length );
	const labelHeights = ( input.columnLabelHeight ?? 0 ) + ( input.groupLabelHeight ?? 0 );
	const bandTracks =
		( input.columnLabelHeight === null ? 0 : 1 ) +
		rows +
		( input.groupLabelHeight === null ? 0 : 1 );
	let best: CompactCellFit | null = null;

	for ( let target = 1; target <= maxBands; target++ ) {
		const wrapped = target > 1 ? wrapColumnGroups( layout, target, 2 ) : null;
		if ( target > 1 && ! wrapped ) {
			break;
		}

		const bands = wrapped?.bands ?? 1;
		const cellColumns = wrapped
			? wrapped.slotSpans.reduce( ( sum, span ) => sum + span, 0 )
			: columns;
		const gapTracks = wrapped
			? wrapped.slotSpans.length - 1
			: layout.columns.filter( column => column.gapBefore ).length;
		// The row-label track, the cell tracks and the group-gap tracks, one cell gap apart.
		const columnTracks = 1 + cellColumns + gapTracks;
		const byWidth =
			( width - input.rowLabelWidth - gapTracks * groupGap - ( columnTracks - 1 ) * cellGap ) /
			cellColumns;

		// Each band's tracks, plus one group-gap track between bands.
		const rowTracks = bands * bandTracks + ( bands - 1 );
		const fixedHeight =
			bands * labelHeights + ( bands - 1 ) * groupGap + ( rowTracks - 1 ) * cellGap;
		const byHeight = ( height - fixedHeight ) / ( bands * rows );

		const cellSize = Math.floor( Math.min( byWidth, byHeight ) );
		if ( cellSize >= minCellSize && ( ! best || cellSize > best.cellSize ) ) {
			best = { bands, cellSize };
		}
	}

	return best ?? { bands: 1, cellSize: minCellSize };
};
