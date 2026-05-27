import { akismetKeys } from '@/data/query-keys';

describe( 'akismetKeys', () => {
	it( 'roots every key under [ "akismet" ]', () => {
		expect( akismetKeys.all ).toEqual( [ 'akismet' ] );
		expect( akismetKeys.key() ).toEqual( [ 'akismet', 'key' ] );
		expect( akismetKeys.settings() ).toEqual( [ 'akismet', 'settings' ] );
		expect( akismetKeys.jetpackKey() ).toEqual( [ 'akismet', 'jetpack-key' ] );
	} );

	it( 'returns stable references for the root key (frozen tuple)', () => {
		// Same array identity each access — important so React Query can
		// fuzzy-match prefix invalidations without `JSON.stringify` churn.
		expect( akismetKeys.all ).toBe( akismetKeys.all );
	} );

	it( "child keys begin with the parent's prefix", () => {
		// Critical invariant: `invalidateQueries( { queryKey: akismetKeys.all } )`
		// must invalidate every descendant. Match the first element.
		expect( akismetKeys.key()[ 0 ] ).toBe( akismetKeys.all[ 0 ] );
		expect( akismetKeys.settings()[ 0 ] ).toBe( akismetKeys.all[ 0 ] );
		expect( akismetKeys.jetpackKey()[ 0 ] ).toBe( akismetKeys.all[ 0 ] );
	} );

	describe( 'Plan 2 — stats / category / blackbox / woocommerce nodes', () => {
		it( 'stats — exposes hierarchical helpers under akismet/stats/*', () => {
			expect( akismetKeys.stats.all() ).toEqual( [ 'akismet', 'stats' ] );
			expect( akismetKeys.stats.totals( '30-days' ) ).toEqual( [
				'akismet',
				'stats',
				'totals',
				'30-days',
			] );
			expect( akismetKeys.stats.timeseries( '60-days' ) ).toEqual( [
				'akismet',
				'stats',
				'timeseries',
				'60-days',
			] );
		} );

		it( 'category — summary key includes the category id + interval', () => {
			expect( akismetKeys.category.all() ).toEqual( [ 'akismet', 'category' ] );
			expect( akismetKeys.category.summary( 'logins', '30-days' ) ).toEqual( [
				'akismet',
				'category',
				'summary',
				'logins',
				'30-days',
			] );
		} );

		it( 'blackbox — aggregates key includes category + interval', () => {
			expect( akismetKeys.blackbox.all() ).toEqual( [ 'akismet', 'blackbox' ] );
			expect( akismetKeys.blackbox.aggregates( 'bots', '6-months' ) ).toEqual( [
				'akismet',
				'blackbox',
				'aggregates',
				'bots',
				'6-months',
			] );
		} );

		it( 'woocommerce — fraud summary key includes interval', () => {
			expect( akismetKeys.woocommerce.all() ).toEqual( [ 'akismet', 'woocommerce' ] );
			expect( akismetKeys.woocommerce.fraudSummary( 'all' ) ).toEqual( [
				'akismet',
				'woocommerce',
				'fraud-summary',
				'all',
			] );
		} );

		it( "every new child key begins with akismetKeys.all's prefix", () => {
			expect( akismetKeys.stats.totals( '30-days' )[ 0 ] ).toBe( akismetKeys.all[ 0 ] );
			expect( akismetKeys.category.summary( 'logins', '30-days' )[ 0 ] ).toBe(
				akismetKeys.all[ 0 ]
			);
			expect( akismetKeys.blackbox.aggregates( 'bots', '6-months' )[ 0 ] ).toBe(
				akismetKeys.all[ 0 ]
			);
			expect( akismetKeys.woocommerce.fraudSummary( 'all' )[ 0 ] ).toBe( akismetKeys.all[ 0 ] );
		} );
	} );
} );
