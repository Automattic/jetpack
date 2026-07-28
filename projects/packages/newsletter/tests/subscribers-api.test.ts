import apiFetch from '@wordpress/api-fetch';
import { fetchSubscribedNewsletterCategories } from '../_inc/subscribers/data/api';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as unknown as jest.Mock;

/**
 * The path the fetcher asked `apiFetch` for.
 *
 * @return Request path.
 */
function requestedPath(): string {
	return mockApiFetch.mock.calls[ 0 ][ 0 ].path;
}

describe( 'fetchSubscribedNewsletterCategories', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( { enabled: true, newsletter_categories: [] } );
	} );

	it( 'keys the request by user id and flags type=wpcom when a user id is present', async () => {
		// WP.com reads a *subscription* record by default and only treats the path segment as a user
		// id when told to, so getting this branch wrong silently reads the wrong record.
		await fetchSubscribedNewsletterCategories( { subscription_id: 946836646, user_id: 229907063 } );

		expect( requestedPath() ).toBe(
			'/wpcom/v2/newsletter-categories/subscriptions/229907063?type=wpcom'
		);
	} );

	it( 'keys the request by subscription id, with no type, for an email-only subscriber', async () => {
		await fetchSubscribedNewsletterCategories( { subscription_id: 946836646 } );

		expect( requestedPath() ).toBe( '/wpcom/v2/newsletter-categories/subscriptions/946836646' );
	} );

	it( 'treats a zero user id as absent', async () => {
		// Callers pass `user_id: 0` rather than omitting it for email-only subscribers.
		await fetchSubscribedNewsletterCategories( { subscription_id: 946836646, user_id: 0 } );

		expect( requestedPath() ).toBe( '/wpcom/v2/newsletter-categories/subscriptions/946836646' );
	} );

	it( 'issues a GET', async () => {
		await fetchSubscribedNewsletterCategories( { user_id: 229907063 } );

		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].method ).toBe( 'GET' );
	} );
} );
