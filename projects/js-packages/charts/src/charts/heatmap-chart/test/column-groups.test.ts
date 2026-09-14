import { resolveColumnGroups } from '../private/column-groups';

const lines = ( columns: { line: number }[] ) => columns.map( column => column.line );
const gaps = ( columns: { gapBefore: boolean }[] ) => columns.map( column => column.gapBefore );

describe( 'resolveColumnGroups', () => {
	test( 'no groups: consecutive lines from the first, no gaps', () => {
		const layout = resolveColumnGroups( undefined, 3, 2 );
		expect( layout.groups ).toEqual( [] );
		expect( lines( layout.columns ) ).toEqual( [ 2, 3, 4 ] );
		expect( gaps( layout.columns ) ).toEqual( [ false, false, false ] );
		expect( resolveColumnGroups( [], 2, 2 ).columns ).toHaveLength( 2 );
	} );

	test( 'no columns: no groups and no warning, whatever the spans', () => {
		expect( resolveColumnGroups( [ { label: 'A', span: 3 } ], 0, 2 ) ).toEqual( {
			columns: [],
			groups: [],
		} );
		expect( console ).not.toHaveWarned();
	} );

	test( 'skips one line before the first column of every group but the first', () => {
		const groups = [
			{ label: 'A', span: 2 },
			{ label: 'B', span: 1 },
			{ label: 'C', span: 2 },
		];
		const layout = resolveColumnGroups( groups, 5, 2 );
		expect( lines( layout.columns ) ).toEqual( [ 2, 3, 5, 7, 8 ] );
		expect( gaps( layout.columns ) ).toEqual( [ false, false, true, true, false ] );
		expect( layout.groups ).toEqual( [
			{ label: 'A', span: 2, line: 2 },
			{ label: 'B', span: 1, line: 5 },
			{ label: 'C', span: 2, line: 7 },
		] );
	} );

	test( 'leaves columns past the last group ungrouped and ungapped', () => {
		const layout = resolveColumnGroups( [ { label: 'A', span: 2 } ], 4, 2 );
		expect( lines( layout.columns ) ).toEqual( [ 2, 3, 4, 5 ] );
		expect( gaps( layout.columns ) ).toEqual( [ false, false, false, false ] );
	} );

	test.each( [
		[ 'zero', 0 ],
		[ 'negative', -1 ],
		[ 'fractional', 1.5 ],
		[ 'NaN', NaN ],
	] )( 'warns once and drops every group on a %s span', ( _, span ) => {
		const layout = resolveColumnGroups(
			[
				{ label: 'A', span: 1 },
				{ label: 'B', span },
			],
			4,
			2
		);
		expect( layout.groups ).toEqual( [] );
		expect( lines( layout.columns ) ).toEqual( [ 2, 3, 4, 5 ] );
		expect( console ).toHaveWarned();
	} );

	test( 'warns once and drops every group when the spans reach past the last column', () => {
		const layout = resolveColumnGroups(
			[
				{ label: 'A', span: 3 },
				{ label: 'B', span: 2 },
			],
			4,
			2
		);
		expect( layout.groups ).toEqual( [] );
		expect( console ).toHaveWarned();
	} );
} );
