import apiFetch from '@wordpress/api-fetch';
import { fetchSubscriberDetails, fetchSubscribers } from '../api';
import type { SubscribersQueryParams } from '../types';

jest.mock( '@wordpress/api-fetch' );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

const query: SubscribersQueryParams = {
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

afterEach( () => {
	mockedApiFetch.mockReset();
} );

// WP.com's formatter casts digit-only strings to integers, so these names arrive as numbers and
// take the whole table down when DataViews calls a string method on the row title.
describe.each( [
	[ 102030, '102030' ],
	[ 0, '0' ],
	[ undefined, '' ],
	[ '*', '*' ],
] )( 'display_name %p from WP.com', ( raw, expected ) => {
	it( `reaches the subscribers list as the string ${ JSON.stringify( expected ) }`, async () => {
		mockedApiFetch.mockResolvedValue( {
			total: 1,
			pages: 1,
			page: 1,
			per_page: 20,
			subscribers: [ { ...row, display_name: raw } ],
		} );

		const { subscribers } = await fetchSubscribers( query );

		expect( subscribers[ 0 ].display_name ).toBe( expected );
	} );

	it( `reaches the subscriber detail as the string ${ JSON.stringify( expected ) }`, async () => {
		mockedApiFetch.mockResolvedValue( { ...row, display_name: raw } );

		const subscriber = await fetchSubscriberDetails( { user_id: row.user_id } );

		expect( subscriber.display_name ).toBe( expected );
	} );
} );

it( 'tolerates a list response with no subscribers array', async () => {
	mockedApiFetch.mockResolvedValue( { total: 0, pages: 0, page: 1, per_page: 20 } );

	await expect( fetchSubscribers( query ) ).resolves.toMatchObject( { subscribers: [] } );
} );
