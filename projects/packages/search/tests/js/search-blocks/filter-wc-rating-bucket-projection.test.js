import { bucketsToStarCountMap } from '../../../src/search-blocks/blocks/filter-wc-rating/bucket-projection';

describe( 'bucketsToStarCountMap (filter-wc-rating cumulative projection)', () => {
	it( 'returns a baseline { "1": 0..."5": 0 } map for null / non-array input', () => {
		expect( bucketsToStarCountMap( undefined ) ).toEqual( {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		} );
		expect( bucketsToStarCountMap( null ) ).toEqual( {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		} );
	} );

	it( 'drops the implicit -0.5 "no rating" bucket and any other key < 0.5', () => {
		expect(
			bucketsToStarCountMap( [
				{ key: -0.5, doc_count: 27 },
				{ key: 0.0, doc_count: 5 },
				{ key: 0.49, doc_count: 99 },
			] )
		).toEqual( { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } );
	} );

	it( 'projects a 4.5-key bucket onto every star row (1..5) — the all-up case', () => {
		// avg ∈ [4.5, 5] rounds to 5★, so it should also count toward
		// every "& up" row that has a lower threshold.
		expect( bucketsToStarCountMap( [ { key: 4.5, doc_count: 7 } ] ) ).toEqual( {
			1: 7,
			2: 7,
			3: 7,
			4: 7,
			5: 7,
		} );
	} );

	it( 'projects a 0.5-key bucket onto only the 1★ row — the no-cumulation case', () => {
		// avg ∈ [0.5, 1.5) rounds to 1★, so only the 1★ & up row should
		// receive the count.
		expect( bucketsToStarCountMap( [ { key: 0.5, doc_count: 3 } ] ) ).toEqual( {
			1: 3,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		} );
	} );

	it( 'sums multiple buckets cumulatively to produce monotone counts', () => {
		// Mirrors the live atlas test store — one product rated 4★, one
		// rated 2★, 26 unrated. Expected reading top-down: 0, 1, 1, 2, 2.
		const map = bucketsToStarCountMap( [
			{ key: -0.5, doc_count: 26 },
			{ key: 0.5, doc_count: 0 },
			{ key: 1.5, doc_count: 1 },
			{ key: 2.5, doc_count: 0 },
			{ key: 3.5, doc_count: 1 },
		] );
		expect( map ).toEqual( { 1: 2, 2: 2, 3: 1, 4: 1, 5: 0 } );
		// Monotone-decreasing as the threshold rises:
		expect( map[ 1 ] ).toBeGreaterThanOrEqual( map[ 2 ] );
		expect( map[ 2 ] ).toBeGreaterThanOrEqual( map[ 3 ] );
		expect( map[ 3 ] ).toBeGreaterThanOrEqual( map[ 4 ] );
		expect( map[ 4 ] ).toBeGreaterThanOrEqual( map[ 5 ] );
	} );

	it( 'is keyed by string ("1".."5") so the data-wp-context star value reads correctly', () => {
		const map = bucketsToStarCountMap( [ { key: 4.5, doc_count: 1 } ] );
		// The view reads `counts[starValue]` where starValue is a string
		// from data-wp-context. Both numeric and string lookups land the
		// same value because JS object property access coerces the index
		// to a string anyway, but we assert the explicit string keys to
		// pin the contract.
		expect( map[ '5' ] ).toBe( 1 );
		expect( map[ '1' ] ).toBe( 1 );
		// Property keys are explicitly strings.
		expect( Object.keys( map ).sort() ).toEqual( [ '1', '2', '3', '4', '5' ] );
	} );
} );
