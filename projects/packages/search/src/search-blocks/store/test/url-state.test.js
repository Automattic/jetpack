import { getSearchOwnedParamKeys } from '../url-state';

/**
 * Wrap a query string in `URLSearchParams` for the function under test.
 *
 * @param {string} query - Query string without the leading `?`.
 * @return {URLSearchParams} Parsed params.
 */
function params( query ) {
	return new URLSearchParams( query );
}

describe( 'getSearchOwnedParamKeys', () => {
	it( 'claims reserved params', () => {
		const owned = getSearchOwnedParamKeys(
			params( 's=shirt&orderby=newest&min_price=5&max_price=50' )
		);
		expect( owned.sort() ).toEqual( [ 'max_price', 'min_price', 'orderby', 's' ] );
	} );

	it( 'claims array-shaped filter and query_type params', () => {
		const owned = getSearchOwnedParamKeys( params( 'category[]=news&query_type_category=and' ) );
		expect( owned.sort() ).toEqual( [ 'category[]', 'query_type_category' ] );
	} );

	it( 'claims the scalar post_type alias the writer never emits', () => {
		const owned = getSearchOwnedParamKeys( params( 's=shirt&post_type=product' ) );
		expect( owned.sort() ).toEqual( [ 'post_type', 's' ] );
	} );

	it( 'leaves unrelated third-party params alone', () => {
		const owned = getSearchOwnedParamKeys( params( 's=shirt&utm_source=twitter&page_id=12' ) );
		expect( owned ).toEqual( [ 's' ] );
	} );

	it( 'returns an empty array when no search params are present', () => {
		expect( getSearchOwnedParamKeys( params( 'utm_source=twitter' ) ) ).toEqual( [] );
	} );
} );
