import { warnOnce } from '../../../utils/warn-once';
import type { HeatmapColumnGroup } from '../types';

export type ColumnGroupLayout = {
	/** One per data column: its grid column line, and whether a gap track precedes it. */
	columns: { line: number; gapBefore: boolean }[];
	/** The groups as given, each with the grid column line its label starts on; none when any was unusable. */
	groups: ( HeatmapColumnGroup & { line: number } )[];
};

const isSpan = ( span: number ) => Number.isInteger( span ) && span > 0;

/**
 * Validates column groups and lays them over the columns.
 *
 * @param groups      - Groups as passed to the chart.
 * @param columnCount - Number of data columns.
 * @param firstLine   - Grid column line of the first data column.
 * @return Grid column lines for every column and group; no groups when the input was unusable.
 */
export const resolveColumnGroups = (
	groups: HeatmapColumnGroup[] | undefined,
	columnCount: number,
	firstLine: number
): ColumnGroupLayout => {
	const ungrouped = (): ColumnGroupLayout => ( {
		columns: Array.from( { length: columnCount }, ( _, index ) => ( {
			line: firstLine + index,
			gapBefore: false,
		} ) ),
		groups: [],
	} );

	// An empty grid draws nothing, so static groups awaiting data are not a misuse.
	if ( ! groups || groups.length === 0 || columnCount === 0 ) {
		return ungrouped();
	}

	const spans = groups.map( group => group.span );
	const total = spans.reduce( ( sum, span ) => sum + span, 0 );
	if ( ! spans.every( isSpan ) || total > columnCount ) {
		warnOnce(
			`heatmap:columnGroups:${ JSON.stringify( spans ) }:${ columnCount }`,
			`columnGroups spans ${ JSON.stringify(
				spans
			) } must be positive integers that fit the ${ columnCount } columns, so no groups are drawn.`
		);
		return ungrouped();
	}

	const columns: ColumnGroupLayout[ 'columns' ] = [];
	const laidOut: ColumnGroupLayout[ 'groups' ] = [];
	let line = firstLine;
	groups.forEach( ( group, groupIndex ) => {
		if ( groupIndex > 0 ) {
			line += 1;
		}
		laidOut.push( { ...group, line } );
		for ( let offset = 0; offset < group.span; offset++ ) {
			columns.push( { line, gapBefore: groupIndex > 0 && offset === 0 } );
			line += 1;
		}
	} );
	// An ungrouped tail opens no further gap.
	while ( columns.length < columnCount ) {
		columns.push( { line, gapBefore: false } );
		line += 1;
	}

	return { columns, groups: laidOut };
};
