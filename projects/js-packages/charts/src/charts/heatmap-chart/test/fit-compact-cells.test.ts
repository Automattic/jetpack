import { resolveColumnGroups } from '../private/column-groups';
import { fitCompactCells } from '../private/fit-compact-cells';

const monthGroups = Array.from( { length: 12 }, ( _, index ) => ( {
	label: `M${ index + 1 }`,
	span: 7,
} ) );

// Twelve month calendars, weekdays across and six weeks down, labelled beneath.
const months = {
	layout: resolveColumnGroups( monthGroups, 84, 2 ),
	rows: 6,
	cellGap: 2,
	groupGap: 16,
	rowLabelWidth: 0,
	columnLabelHeight: null,
	groupLabelHeight: 22,
	minCellSize: 11,
};

describe( 'fitCompactCells', () => {
	test.each( [
		[ 'a one-row tile keeps one band at the floor', 1189, 110, { bands: 1, cellSize: 11 } ],
		[ 'a wide one-row tile grows its single band', 1900, 130, { bands: 1, cellSize: 16 } ],
		[ 'a two-row tile wraps into two bands of six', 1189, 300, { bands: 2, cellSize: 17 } ],
		[ 'a tall narrow tile wraps into four bands of three', 372, 641, { bands: 4, cellSize: 14 } ],
		[
			'a narrow tile wraps rather than overflow at the floor',
			320,
			641,
			{ bands: 4, cellSize: 11 },
		],
	] )( '%s', ( _, width, height, expected ) => {
		expect( fitCompactCells( { ...months, width, height } ) ).toEqual( expected );
	} );

	test( 'sizes a grid with an ungrouped tail for the one band it can draw', () => {
		const layout = resolveColumnGroups( monthGroups.slice( 0, 3 ), 22, 2 );
		expect( fitCompactCells( { ...months, layout, width: 400, height: 400 } ) ).toEqual( {
			bands: 1,
			cellSize: 14,
		} );
	} );

	test( 'leaves room for the row-label track and the column-label row', () => {
		expect(
			fitCompactCells( {
				...months,
				layout: resolveColumnGroups( undefined, 10, 2 ),
				rows: 2,
				groupLabelHeight: null,
				rowLabelWidth: 40,
				columnLabelHeight: 20,
				width: 300,
				height: 100,
			} )
		).toEqual( { bands: 1, cellSize: 24 } );
	} );
} );
