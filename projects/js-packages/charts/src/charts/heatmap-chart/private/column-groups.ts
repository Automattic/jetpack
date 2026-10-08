import { warnOnce } from '../../../utils/warn-once';
import type { HeatmapColumnGroup } from '../types';

export type ColumnGroupLayout = {
	/** One per data column: its grid column line, whether a gap track precedes it, and its group's index. */
	columns: { line: number; gapBefore: boolean; group?: number }[];
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
			columns.push( { line, gapBefore: groupIndex > 0 && offset === 0, group: groupIndex } );
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

export type WrappedColumnGroupLayout = {
	/** One per data column: its grid column line and the band it sits in. */
	columns: { line: number; band: number }[];
	/** The groups, each with the line its label starts on and its band. */
	groups: ( HeatmapColumnGroup & { line: number; band: number } )[];
	/** Columns per group slot: the widest group in that position on any band. */
	slotSpans: number[];
	bands: number;
};

/**
 * Wraps the groups onto bands of equal group count, each band starting back at
 * `firstLine` so the groups line up in slots down the bands.
 *
 * @param layout    - The unwrapped layout from `resolveColumnGroups`.
 * @param bands     - Bands to aim for; the groups split as evenly as whole bands allow.
 * @param firstLine - Grid column line of the first data column.
 * @return The wrapped layout, or null when there is nothing to wrap: one band, one group, or a column outside every group.
 */
export const wrapColumnGroups = (
	layout: ColumnGroupLayout,
	bands: number,
	firstLine: number
): WrappedColumnGroupLayout | null => {
	const { columns, groups } = layout;
	if ( bands < 2 || groups.length < 2 || columns.some( column => column.group === undefined ) ) {
		return null;
	}

	const perBand = Math.ceil( groups.length / bands );
	const slotSpans = Array.from( { length: perBand }, ( _, slot ) =>
		Math.max( ...groups.filter( ( _group, index ) => index % perBand === slot ).map( g => g.span ) )
	);
	const slotLines: number[] = [];
	let line = firstLine;
	slotSpans.forEach( ( span, slot ) => {
		if ( slot > 0 ) {
			line += 1;
		}
		slotLines.push( line );
		line += span;
	} );

	const wrappedGroups = groups.map( ( group, index ) => ( {
		...group,
		line: slotLines[ index % perBand ],
		band: Math.floor( index / perBand ),
	} ) );
	const wrappedColumns = columns.map( column => {
		const group = column.group as number;
		const offset = column.line - groups[ group ].line;
		return { line: wrappedGroups[ group ].line + offset, band: wrappedGroups[ group ].band };
	} );

	return {
		columns: wrappedColumns,
		groups: wrappedGroups,
		slotSpans,
		bands: Math.ceil( groups.length / perBand ),
	};
};
