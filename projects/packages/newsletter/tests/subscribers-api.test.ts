import apiFetch from '@wordpress/api-fetch';
import {
	addComp,
	addSubscribers,
	fetchNewsletterCategories,
	fetchSubscribedNewsletterCategories,
	fetchSubscriberDetails,
	fetchSubscribers,
} from '../_inc/subscribers/data/api';
import type { SubscribersQueryParams } from '../_inc/subscribers/data/types';

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

describe( 'addComp', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( {} );
	} );

	it( 'POSTs a user id for a subscriber with a wpcom account', async () => {
		await addComp( { user_id: 229907063, plan_id: 51, no_expiration: true } );

		expect( requestedOptions().path ).toBe( '/wpcom/v2/subscribers/comp' );
		expect( requestedOptions().method ).toBe( 'POST' );
		expect( requestedOptions().data ).toEqual( {
			user_id: 229907063,
			plan_id: 51,
			no_expiration: true,
		} );
	} );

	it( 'POSTs an email and no user id for an email-only subscriber', async () => {
		await addComp( { email: 'reader@example.com', plan_id: 51 } );

		expect( requestedOptions().data ).toEqual( { email: 'reader@example.com', plan_id: 51 } );
		expect( requestedOptions().data ).not.toHaveProperty( 'user_id' );
	} );
} );

const listQuery: SubscribersQueryParams = {
	page: 1,
	perPage: 20,
	sort: 'date_subscribed',
	sortOrder: 'desc',
	filters: [ 'all' ],
};

const row = {
	user_id: 1234,
	email_address: 'reader@example.com',
	subscription_status: 'Subscribed',
};

/**
 * A one-row subscribers list response carrying the given subscriber fields.
 *
 * @param subscriber - Fields to merge into the row.
 * @return List response.
 */
function listResponse( subscriber: Record< string, unknown > ) {
	return { total: 1, pages: 1, page: 1, per_page: 20, subscribers: [ { ...row, ...subscriber } ] };
}

describe.each( [
	[ 102030, '102030' ],
	[ 0, '0' ],
	[ null, '' ],
	[ undefined, '' ],
	[ '*', '*' ],
] )( 'display_name %p from WP.com', ( raw, expected ) => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( `reaches the list as ${ JSON.stringify( expected ) }`, async () => {
		mockApiFetch.mockResolvedValue( listResponse( { display_name: raw } ) );

		const { subscribers } = await fetchSubscribers( listQuery );

		expect( subscribers[ 0 ].display_name ).toBe( expected );
	} );

	it( `reaches the detail view as ${ JSON.stringify( expected ) }`, async () => {
		mockApiFetch.mockResolvedValue( { ...row, display_name: raw } );

		const subscriber = await fetchSubscriberDetails( { user_id: row.user_id } );

		expect( subscriber.display_name ).toBe( expected );
	} );
} );

describe( 'fetchSubscribers', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'tolerates a response with no subscribers array', async () => {
		mockApiFetch.mockResolvedValue( { total: 0, pages: 0, page: 1, per_page: 20 } );

		await expect( fetchSubscribers( listQuery ) ).resolves.toMatchObject( { subscribers: [] } );
	} );
} );
