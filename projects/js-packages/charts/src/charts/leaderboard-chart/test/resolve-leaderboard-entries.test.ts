import { resolveLeaderboardEntries } from '../private/resolve-leaderboard-entries';
import type { LeaderboardEntry } from '../../../types';

type EntryInput = Partial< LeaderboardEntry > & { currentValue: number };

const toEntries = ( rows: EntryInput[] ) =>
	rows.map( ( row, index ) => ( {
		id: `row-${ index }`,
		label: `Row ${ index }`,
		...row,
	} ) ) as LeaderboardEntry[];

describe( 'resolveLeaderboardEntries', () => {
	const comparisonRows = [
		{ currentValue: 50, previousValue: 100 },
		{ currentValue: 25, previousValue: 40 },
	];

	it( 'derives both shares and delta against one max across both periods', () => {
		const result = resolveLeaderboardEntries( toEntries( comparisonRows ), {
			includePrevious: true,
		} );

		expect(
			result.map( ( { currentShare, previousShare, delta } ) => ( {
				currentShare,
				previousShare,
				delta,
			} ) )
		).toEqual( [
			{ currentShare: 50, previousShare: 100, delta: -50 },
			{ currentShare: 25, previousShare: 40, delta: -37.5 },
		] );
	} );

	it( 'lets a negative previous value set the max', () => {
		const [ entry ] = resolveLeaderboardEntries(
			toEntries( [ { currentValue: 10, previousValue: -40 } ] ),
			{ includePrevious: true }
		);

		expect( entry ).toMatchObject( { currentShare: 25, previousShare: -100 } );
	} );

	it( 'ignores previous values for the max when comparison bars are not drawn', () => {
		const result = resolveLeaderboardEntries( toEntries( comparisonRows ), {
			includePrevious: false,
		} );

		expect( result.map( ( { currentShare } ) => currentShare ) ).toEqual( [ 100, 50 ] );
	} );

	it( 'keeps passed fields and derives the rest', () => {
		const [ entry ] = resolveLeaderboardEntries(
			toEntries( [ { currentValue: 50, currentShare: 10, previousValue: 100, delta: 7 } ] ),
			{ includePrevious: true }
		);

		expect( entry ).toMatchObject( { currentShare: 10, delta: 7, previousShare: 100 } );
	} );

	it( 'derives a missing share from the max over every row, passed or not', () => {
		const result = resolveLeaderboardEntries(
			toEntries( [ { currentValue: 10, currentShare: 100 }, { currentValue: 20 } ] ),
			{ includePrevious: false }
		);

		expect( result.map( ( { currentShare } ) => currentShare ) ).toEqual( [ 100, 100 ] );
	} );

	it( 'keeps the sign of negative values', () => {
		const result = resolveLeaderboardEntries(
			toEntries( [ { currentValue: -30 }, { currentValue: 60 } ] ),
			{ includePrevious: false }
		);

		expect( result.map( ( { currentShare } ) => currentShare ) ).toEqual( [ -50, 100 ] );
	} );

	it( 'clamps negative shares to 0 and sizes the rest against the largest positive value', () => {
		const result = resolveLeaderboardEntries(
			toEntries( [
				{ currentValue: -90, previousValue: 30 },
				{ currentValue: 60, previousValue: -10, previousShare: -20 },
			] ),
			{ includePrevious: true, clampNegative: true }
		);

		expect(
			result.map( ( { currentShare, previousShare, delta } ) => ( {
				currentShare,
				previousShare,
				delta,
			} ) )
		).toEqual( [
			{ currentShare: 0, previousShare: 50, delta: -400 },
			{ currentShare: 100, previousShare: 0, delta: 700 },
		] );
	} );

	it.each( [
		{ currentValue: 5, previousValue: -10, expected: 150 },
		{ currentValue: 0, previousValue: 0, expected: 0 },
		{ currentValue: 5, previousValue: 0, expected: undefined },
		{ currentValue: 5, previousValue: undefined, expected: undefined },
	] )(
		'derives delta $expected for current $currentValue and previous $previousValue',
		( { currentValue, previousValue, expected } ) => {
			const [ entry ] = resolveLeaderboardEntries(
				toEntries( [ { currentValue, previousValue } ] ),
				{ includePrevious: true }
			);

			expect( entry.delta ).toBe( expected );
		}
	);

	it( 'sizes rows without a previous value against the shared max', () => {
		const result = resolveLeaderboardEntries(
			toEntries( [ { currentValue: 50, previousValue: 100 }, { currentValue: 25 } ] ),
			{ includePrevious: true }
		);

		expect( result.map( ( { currentShare } ) => currentShare ) ).toEqual( [ 50, 25 ] );
		expect( result[ 1 ] ).not.toHaveProperty( 'previousShare' );
	} );

	it( 'gives shares of 0 when every value is 0', () => {
		const [ entry ] = resolveLeaderboardEntries(
			toEntries( [ { currentValue: 0, previousValue: 0 } ] ),
			{ includePrevious: true }
		);

		expect( entry ).toMatchObject( { currentShare: 0, previousShare: 0, delta: 0 } );
	} );

	it( 'leaves other fields untouched', () => {
		const onClick = jest.fn();
		const [ entry ] = resolveLeaderboardEntries(
			toEntries( [ { id: 'a', label: 'A', currentValue: 1, onClick } ] ),
			{ includePrevious: false }
		);

		expect( entry ).toMatchObject( { id: 'a', label: 'A', onClick } );
	} );
} );
