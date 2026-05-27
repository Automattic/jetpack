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
} );
