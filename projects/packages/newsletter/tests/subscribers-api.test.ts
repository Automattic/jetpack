import apiFetch from '@wordpress/api-fetch';
import {
	addSubscribers,
	fetchNewsletterCategories,
	fetchSubscribedNewsletterCategories,
} from '../_inc/subscribers/data/api';

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

/**
 * The full request options passed to `apiFetch` on the first call.
 *
 * @return Request options (path, method, data).
 */
function requestedOptions(): { path: string; method: string; data?: Record< string, unknown > } {
	return mockApiFetch.mock.calls[ 0 ][ 0 ];
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

describe( 'fetchNewsletterCategories', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( { enabled: true, newsletter_categories: [] } );
	} );

	it( 'GETs the site-level, subscriber-agnostic categories endpoint', async () => {
		// This is the gate the import picker reads — it must NOT hit the per-subscriber
		// `/subscriptions/{id}` route, which can't be resolved without a subscriber.
		await fetchNewsletterCategories();

		expect( requestedOptions().path ).toBe( '/wpcom/v2/newsletter-categories' );
		expect( requestedOptions().method ).toBe( 'GET' );
	} );
} );

describe( 'addSubscribers', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( { upload_id: 1 } );
	} );

	it( 'POSTs emails to the add endpoint', async () => {
		await addSubscribers( [ 'reader@example.com' ] );

		expect( requestedOptions().path ).toBe( '/wpcom/v2/subscribers/add' );
		expect( requestedOptions().method ).toBe( 'POST' );
		expect( requestedOptions().data ).toEqual( { emails: [ 'reader@example.com' ] } );
	} );

	it( 'includes selected category ids in the payload', async () => {
		await addSubscribers( [ 'reader@example.com' ], [ 7, 12 ] );

		expect( requestedOptions().data ).toEqual( {
			emails: [ 'reader@example.com' ],
			categories: [ 7, 12 ],
		} );
	} );

	it( 'omits the categories key entirely when none are selected', async () => {
		// A plain import must send the exact payload it always did — no empty `categories` array —
		// so existing behavior is untouched on sites that don't use categories.
		await addSubscribers( [ 'reader@example.com' ], [] );

		expect( requestedOptions().data ).not.toHaveProperty( 'categories' );
	} );
} );
