import { resolveColumnGroups } from '../private/column-groups';

describe( 'resolveColumnGroups', () => {
	test( 'no groups: no gaps before any column', () => {
		expect( resolveColumnGroups( undefined, 3 ) ).toEqual( {
			groups: [],
			starts: [],
			gapsBefore: [ 0, 0, 0 ],
		} );
		expect( resolveColumnGroups( [], 2 ).gapsBefore ).toEqual( [ 0, 0 ] );
	} );

	test( 'counts one gap before the first column of every group but the first', () => {
		const groups = [
			{ label: 'A', span: 2 },
			{ label: 'B', span: 1 },
			{ label: 'C', span: 2 },
		];
		expect( resolveColumnGroups( groups, 5 ) ).toEqual( {
			groups,
			starts: [ 0, 2, 3 ],
			gapsBefore: [ 0, 0, 1, 2, 2 ],
		} );
	} );

	test( 'leaves columns past the last group ungrouped and ungapped', () => {
		const groups = [ { label: 'A', span: 2 } ];
		expect( resolveColumnGroups( groups, 4 ).gapsBefore ).toEqual( [ 0, 0, 0, 0 ] );
	} );

	test.each( [
		[ 'zero', 0 ],
		[ 'negative', -1 ],
		[ 'fractional', 1.5 ],
		[ 'NaN', NaN ],
	] )( 'warns once and drops every group on a %s span', ( _, span ) => {
		const result = resolveColumnGroups(
			[
				{ label: 'A', span: 1 },
				{ label: 'B', span },
			],
			4
		);
		expect( result.groups ).toEqual( [] );
		expect( result.gapsBefore ).toEqual( [ 0, 0, 0, 0 ] );
		expect( console ).toHaveWarned();
	} );

	test( 'warns once and drops every group when the spans reach past the last column', () => {
		const result = resolveColumnGroups(
			[
				{ label: 'A', span: 3 },
				{ label: 'B', span: 2 },
			],
			4
		);
		expect( result.groups ).toEqual( [] );
		expect( console ).toHaveWarned();
	} );
} );
