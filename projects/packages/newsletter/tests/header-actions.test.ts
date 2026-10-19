import { getCsvDownloadUrl } from '../_inc/subscribers/components/header-actions';

/**
 * Query parameters of a built CSV download URL.
 *
 * @param url - URL returned by `getCsvDownloadUrl`.
 * @return Parsed search params.
 */
function paramsOf( url: string | null ): URLSearchParams {
	return new URL( url ?? '' ).searchParams;
}

describe( 'getCsvDownloadUrl', () => {
	it( 'exports everyone when the table has no filter or search', () => {
		const params = paramsOf(
			getCsvDownloadUrl( 123, {
				filters: [],
				search: '',
				sort: 'date_subscribed',
				sortOrder: 'desc',
			} )
		);

		expect( params.get( 'blog' ) ).toBe( '123' );
		expect( params.get( 'blog_subscribers' ) ).toBe( 'csv' );
		expect( params.get( 'type' ) ).toBe( 'all' );
		expect( params.getAll( 'filters[]' ) ).toEqual( [] );
		expect( params.has( 'search' ) ).toBe( false );
		expect( params.get( 'sort' ) ).toBe( 'date_subscribed' );
		expect( params.get( 'sort_order' ) ).toBe( 'desc' );
	} );

	it( 'passes every active filter and the search term', () => {
		const params = paramsOf(
			getCsvDownloadUrl( 123, {
				filters: [ 'paid', 'unconfirmed_subscriber' ],
				search: 'ada & co',
				sort: 'name',
				sortOrder: 'asc',
			} )
		);

		expect( params.getAll( 'filters[]' ) ).toEqual( [ 'paid', 'unconfirmed_subscriber' ] );
		expect( params.get( 'search' ) ).toBe( 'ada & co' );
		expect( params.get( 'sort' ) ).toBe( 'name' );
		expect( params.get( 'sort_order' ) ).toBe( 'asc' );
	} );
} );
