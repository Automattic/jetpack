import { fitCompactCells } from '../private/fit-compact-cells';

// Twelve month calendars, weekdays across and six weeks down, labelled beneath.
const months = {
	groupSpans: Array( 12 ).fill( 7 ),
	columns: 84,
	rows: 6,
	canWrap: true,
	cellGap: 2,
	groupGap: 16,
	rowLabelWidth: 0,
	columnLabelHeight: null,
	groupLabelHeight: 22,
	minCellSize: 11,
};

describe( 'fitCompactCells', () => {
	test.each( [
		[ 'a one-row tile keeps one band at the floor', 1189, 110, true, { bands: 1, cellSize: 11 } ],
		[ 'a wide one-row tile grows its single band', 1900, 130, true, { bands: 1, cellSize: 16 } ],
		[ 'a two-row tile wraps into two bands of six', 1189, 300, true, { bands: 2, cellSize: 17 } ],
		[
			'a tall narrow tile wraps into four bands of three',
			372,
			641,
			true,
			{ bands: 4, cellSize: 14 },
		],
		[ 'groups that may not wrap stay on one band', 1900, 300, false, { bands: 1, cellSize: 18 } ],
		[
			'groups that may not wrap fall back when one band is too small',
			1189,
			300,
			false,
			{
				bands: 1,
				cellSize: 11,
			},
		],
	] )( '%s', ( _, width, height, canWrap, expected ) => {
		expect( fitCompactCells( { ...months, width, height, canWrap } ) ).toEqual( expected );
	} );

	test( 'grows an ungrouped grid to fill its box', () => {
		expect(
			fitCompactCells( {
				...months,
				groupSpans: [],
				columns: 10,
				rows: 2,
				groupLabelHeight: null,
				width: 300,
				height: 100,
			} )
		).toEqual( { bands: 1, cellSize: 28 } );
	} );
} );
