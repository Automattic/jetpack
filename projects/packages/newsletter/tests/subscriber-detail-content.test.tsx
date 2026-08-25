import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import SubscriberDetailContent from '../_inc/subscribers/components/detail/subscriber-detail-content';
import type {
	SubscribedNewsletterCategories,
	SubscriberDetails,
} from '../_inc/subscribers/data/types';

const mockFetchSubscriberDetails = jest.fn();
const mockFetchSubscriberStats = jest.fn();
const mockFetchSubscribedNewsletterCategories = jest.fn();

jest.mock( '../_inc/subscribers/data/api', () => ( {
	fetchSubscriberDetails: ( ...args: unknown[] ) => mockFetchSubscriberDetails( ...args ),
	fetchSubscriberStats: ( ...args: unknown[] ) => mockFetchSubscriberStats( ...args ),
	fetchSubscribedNewsletterCategories: ( ...args: unknown[] ) =>
		mockFetchSubscribedNewsletterCategories( ...args ),
} ) );

jest.mock( '@automattic/jetpack-components/gravatar', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const OPEN = { subscriptionId: 946836646, userId: 229907063 };

/**
 * Individual-endpoint payload, matching the real shape: one `date_subscribed` rather than the
 * list's `wpcom_`/`email_` pair.
 *
 * @param overrides - Fields to override.
 * @return Subscriber details payload.
 */
function makeDetails( overrides: Partial< SubscriberDetails > = {} ): SubscriberDetails {
	return {
		user_id: OPEN.userId,
		display_name: 'douglashenritest',
		email_address: 'reader@example.com',
		subscription_status: 'Subscribed',
		date_subscribed: '2026-07-28T19:02:09+00:00',
		...overrides,
	};
}

/**
 * Build the categories payload the WP.com endpoint returns: every site category, discriminated by
 * `subscribed`.
 *
 * @param enabled - Whether the site has newsletter categories turned on.
 * @return Categories payload.
 */
function makeCategories( enabled: boolean ): SubscribedNewsletterCategories {
	return {
		enabled,
		newsletter_categories: [
			{ id: 23, name: 'Test Posts', subscribed: true },
			{ id: 24, name: 'Category 2', subscribed: false },
			{ id: 1, name: 'Uncategorized', subscribed: false },
		],
	};
}

/**
 * Render the detail panel with a fresh query client.
 *
 * @return The query client used for the render.
 */
function renderPanel(): QueryClient {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );

	render(
		<QueryClientProvider client={ queryClient }>
			<SubscriberDetailContent open={ OPEN } />
		</QueryClientProvider>
	);

	return queryClient;
}

describe( 'SubscriberDetailContent', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockFetchSubscriberDetails.mockResolvedValue( makeDetails() );
		mockFetchSubscriberStats.mockResolvedValue( {
			emails_sent: 0,
			unique_opens: 0,
			unique_clicks: 0,
		} );
		mockFetchSubscribedNewsletterCategories.mockResolvedValue( makeCategories( true ) );
	} );

	it( 'lists the categories the subscriber receives emails for', async () => {
		renderPanel();

		await expect( screen.findByText( 'Receives emails for' ) ).resolves.toBeInTheDocument();
		// Only categories flagged `subscribed` — WP.com returns every site category and stores
		// opt-outs, so presence in the array means nothing on its own.
		expect( screen.getByText( 'Test Posts' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Category 2/ ) ).not.toBeInTheDocument();
	} );

	it( 'queries the categories endpoint by the identifiers the panel was opened with', async () => {
		renderPanel();

		await waitFor( () =>
			expect( mockFetchSubscribedNewsletterCategories ).toHaveBeenCalledWith( {
				subscription_id: OPEN.subscriptionId,
				user_id: OPEN.userId,
			} )
		);
	} );

	it( 'decodes HTML entities in category names', async () => {
		// WordPress stores term names encoded (`Tips &amp; Tricks`) and WP.com passes them through
		// as stored, so an undecoded name renders the raw entity to the user.
		mockFetchSubscribedNewsletterCategories.mockResolvedValue( {
			enabled: true,
			newsletter_categories: [ { id: 23, name: 'Tips &amp; Tricks', subscribed: true } ],
		} );

		renderPanel();

		await expect( screen.findByText( 'Tips & Tricks' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /&amp;/ ) ).not.toBeInTheDocument();
	} );

	it( 'says so when the subscriber opted out of every category', async () => {
		mockFetchSubscribedNewsletterCategories.mockResolvedValue( {
			enabled: true,
			newsletter_categories: [ { id: 23, name: 'Test Posts', subscribed: false } ],
		} );

		renderPanel();

		await expect(
			screen.findByText( 'Not subscribed to any newsletter categories' )
		).resolves.toBeInTheDocument();
	} );

	it( 'hides the row entirely when the site has newsletter categories turned off', async () => {
		mockFetchSubscribedNewsletterCategories.mockResolvedValue( makeCategories( false ) );

		renderPanel();

		// Wait for the panel to settle before asserting an absence.
		await expect( screen.findByText( 'Subscription type' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Receives emails for' ) ).not.toBeInTheDocument();
	} );

	it( 'hides the row when WP.com has no categories record for the subscriber', async () => {
		// A 404 is an expected absence, not a failure: it resolves to "feature off" so the query
		// settles rather than retrying something that will never succeed.
		mockFetchSubscribedNewsletterCategories.mockRejectedValue( {
			code: 'rest_subscriber_not_found',
			data: { status: 404 },
		} );

		renderPanel();

		await expect( screen.findByText( 'Subscription type' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Receives emails for' ) ).not.toBeInTheDocument();
	} );

	it( 'hides the row on a missing route, for a Jetpack version without the proxy', async () => {
		mockFetchSubscribedNewsletterCategories.mockRejectedValue( { code: 'rest_no_route' } );

		renderPanel();

		await expect( screen.findByText( 'Subscription type' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Receives emails for' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the rest of the panel intact when the categories request errors outright', async () => {
		// A 500 is left to reject so React Query can retry it, rather than being cached as a
		// successful "feature off" for the rest of the session.
		mockFetchSubscribedNewsletterCategories.mockRejectedValue( {
			code: 'internal_server_error',
			data: { status: 500 },
		} );

		renderPanel();

		await expect( screen.findByText( 'Subscription type' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Receives emails for' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the date the individual endpoint reports', async () => {
		renderPanel();

		await expect( screen.findByText( 'Date subscribed' ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders the email subscription status the individual endpoint reports', async () => {
		renderPanel();

		await expect( screen.findByText( 'Email subscription' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Subscribed' ) ).toBeInTheDocument();
	} );

	it( 'omits the status field when the endpoint has no status for the subscriber', async () => {
		mockFetchSubscriberDetails.mockResolvedValue(
			makeDetails( {
				subscription_status: null as unknown as SubscriberDetails[ 'subscription_status' ],
			} )
		);

		renderPanel();

		await expect( screen.findByText( 'Subscription type' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Email subscription' ) ).not.toBeInTheDocument();
	} );
} );
