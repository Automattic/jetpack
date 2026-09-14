import { warnOnce } from '../../../utils/warn-once';
import type { HeatmapColumnGroup } from '../types';

export type ColumnGroupLayout = {
	/** The groups as given, or none when any was unusable. */
	groups: HeatmapColumnGroup[];
	/** Index of the first column of each group. */
	starts: number[];
	/** Group gaps before each column, cumulative: a column's track line is `2 + index + gapsBefore[ index ]`. */
	gapsBefore: number[];
};

const isSpan = ( span: number ) => Number.isInteger( span ) && span > 0;

/**
 * Validates column groups and lays them over the columns.
 *
 * @param groups      - Groups as passed to the chart.
 * @param columnCount - Number of data columns.
 * @return Group starts and per-column gap counts; no groups when the input was unusable.
 */
export const resolveColumnGroups = (
	groups: HeatmapColumnGroup[] | undefined,
	columnCount: number
): ColumnGroupLayout => {
	const none: ColumnGroupLayout = {
		groups: [],
		starts: [],
		gapsBefore: new Array( columnCount ).fill( 0 ),
	};

	// An empty grid draws nothing, so static groups awaiting data are not a misuse.
	if ( ! groups || groups.length === 0 || columnCount === 0 ) {
		return none;
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
		return none;
	}

	const starts: number[] = [];
	const gapsBefore: number[] = [];
	groups.forEach( ( group, groupIndex ) => {
		starts.push( gapsBefore.length );
		for ( let offset = 0; offset < group.span; offset++ ) {
			gapsBefore.push( groupIndex );
		}
	} );
	// An ungrouped tail opens no further gap.
	while ( gapsBefore.length < columnCount ) {
		gapsBefore.push( groups.length - 1 );
	}

	return { groups, starts, gapsBefore };
};
