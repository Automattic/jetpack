export type CompactCellFitInput = {
	/** Width and height (px) the grid may take. */
	width: number;
	height: number;
	/** Spans of the column groups, in order; empty when the columns are ungrouped. */
	groupSpans: number[];
	columns: number;
	rows: number;
	canWrap: boolean;
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
 * @param input - The box, the grid's shape, and its fixed gaps and label sizes.
 * @return The fit; one band at `minCellSize` when no band count reaches it.
 */
export const fitCompactCells = ( input: CompactCellFitInput ): CompactCellFit => {
	const { width, height, groupSpans, columns, rows, cellGap, groupGap, minCellSize } = input;
	const fallback = { bands: 1, cellSize: minCellSize };
	if ( columns === 0 || rows === 0 || width <= 0 || height <= 0 ) {
		return fallback;
	}

	const groups = groupSpans.length;
	const maxBands = input.canWrap && groups > 1 ? groups : 1;
	const columnLabelRow = input.columnLabelHeight === null ? 0 : 1;
	const groupLabelRow = input.groupLabelHeight === null ? 0 : 1;
	let best = fallback;

	for ( let bands = 1; bands <= maxBands; bands++ ) {
		const perBand = groups ? Math.ceil( groups / bands ) : 0;
		// Only counts that fill every band but the last with the same number of groups.
		if ( groups && Math.ceil( groups / perBand ) !== bands ) {
			continue;
		}

		const slotSpans =
			bands === 1
				? [ columns ]
				: Array.from( { length: perBand }, ( _, slot ) =>
						Math.max( ...groupSpans.filter( ( _span, index ) => index % perBand === slot ) )
					);
		const cellColumns = slotSpans.reduce( ( sum, span ) => sum + span, 0 );
		const gapTracks = Math.max( 0, ( bands === 1 ? groups : perBand ) - 1 );
		// The row-label track, the cell tracks and the group-gap tracks, one cell gap apart.
		const columnTracks = 1 + cellColumns + gapTracks;
		const byWidth =
			( width - input.rowLabelWidth - gapTracks * groupGap - ( columnTracks - 1 ) * cellGap ) /
			cellColumns;

		const bandTracks = columnLabelRow + rows + groupLabelRow;
		const rowTracks = bands * bandTracks + ( bands - 1 );
		const fixedHeight =
			bands * ( ( input.columnLabelHeight ?? 0 ) + ( input.groupLabelHeight ?? 0 ) ) +
			( bands - 1 ) * groupGap +
			( rowTracks - 1 ) * cellGap;
		const byHeight = ( height - fixedHeight ) / ( bands * rows );

		const cellSize = Math.floor( Math.min( byWidth, byHeight ) );
		if ( cellSize >= minCellSize && cellSize > best.cellSize ) {
			best = { bands, cellSize };
		}
	}

	return best;
};
