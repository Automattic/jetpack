// The Subscribers table used to hide the viewer's own subscription: when they were the only
// subscriber the component swapped that single row for the cold-start empty state, so a brand-new
// creator read "No subscribers yet" on a site that already had one (NL-772). Every row WP.com
// returns is a real subscription, so these tests pin the table to rendering exactly what the
// endpoint sends, reserve the empty slot for a genuinely empty response, and cover the notice that
// took over the empty state's "Add subscribers" nudge.

const mockUseSubscribers = jest.fn();

jest.mock( '../_inc/subscribers/data/use-subscribers', () => ( {
	useSubscribers: ( ...args: unknown[] ) => mockUseSubscribers( ...args ),
} ) );

jest.mock( '../_inc/subscribers/data/use-memberships-products', () => ( {
	useMembershipsProducts: () => ( { data: [], isError: false } ),
} ) );

jest.mock( '../_inc/subscribers/data/use-subscriber-remove-mutation', () => ( {
	useSubscriberRemoveMutation: () => ( { mutateAsync: jest.fn(), isPending: false } ),
} ) );

jest.mock( '../_inc/subscribers/lib/tracks', () => ( {
	recordTracksEvent: jest.fn(),
} ) );

// The modals are driven by local state these tests never open, and they pull in the REST client.
// Stub them out so the table is the only thing under test.
jest.mock( '../_inc/subscribers/components/modals/unsubscribe-modal', () => ( {
	__esModule: true,
	default: () => null,
} ) );
jest.mock( '../_inc/subscribers/components/modals/comp-modal', () => ( {
	__esModule: true,
	default: () => null,
} ) );
jest.mock( '../_inc/subscribers/components/modals/remove-comp-modal', () => ( {
	__esModule: true,
	default: () => null,
} ) );

jest.mock( '../_inc/subscribers/components/empty-state', () => ( {
	__esModule: true,
	default: () => <div data-testid="empty-state" />,
} ) );

// DataViews owns the table chrome; all these tests need from it is what the component handed
// down — the rows, the pagination totals, and whether the `empty` slot was reached.
jest.mock( '@wordpress/dataviews', () => ( {
	DataViews: ( {
		data,
		paginationInfo,
		empty,
	}: {
		data: unknown[];
		paginationInfo: { totalItems: number; totalPages: number };
		empty: ReactNode;
	} ) => (
		<div>
			<div data-testid="row-count">{ data.length }</div>
			<div data-testid="total-items">{ paginationInfo.totalItems }</div>
			<div data-testid="total-pages">{ paginationInfo.totalPages }</div>
			{ data.length === 0 && empty }
		</div>
	),
} ) );

import { render, screen } from '@testing-library/react';
import SubscribersDataViews from '../_inc/subscribers/components/subscribers-data-views';
import type { Subscriber } from '../_inc/subscribers/data/types';
import type { ReactNode } from 'react';

const SELF_ONLY_NOTICE = /You’re currently your only subscriber/;

/**
 * Look for the self-only prompt. `Notice.Root` also mirrors its message into `@wordpress/a11y`'s
 * live region, which lives on `document.body` and outlives RTL's cleanup — so an unqualified text
 * query matches twice, and keeps matching in the next test.
 *
 * @return The notice's description element, or null.
 */
function querySelfOnlyNotice(): HTMLElement | null {
	return screen.queryByText( SELF_ONLY_NOTICE, { ignore: '.a11y-speak-region' } );
}

/**
 * Build a minimal subscriber row.
 *
 * @param overrides - Fields to set on the row.
 * @return Subscriber.
 */
function makeSubscriber( overrides: Partial< Subscriber > = {} ): Subscriber {
	return {
		user_id: 1,
		display_name: 'Rob Pugh',
		email_address: 'rob.pugh@example.com',
		subscription_status: 'Subscribed',
		wpcom_subscription_id: 10,
		...overrides,
	};
}

/**
 * Point `useSubscribers` at a canned list response. Defaults to the NL-772 payload: a single row,
 * and that row is the viewer's own subscription.
 *
 * @param overrides - Response fields to override.
 */
function mockResponse( overrides: Record< string, unknown > = {} ) {
	mockUseSubscribers.mockReturnValue( {
		data: {
			total: 1,
			pages: 1,
			page: 1,
			per_page: 20,
			subscribers: [ makeSubscriber() ],
			is_owner_subscribed: true,
			...overrides,
		},
		isLoading: false,
		error: null,
	} );
}

/**
 * Render the table.
 *
 * @param onAddSubscribers - Add Subscribers handler, so the notice CTA can be asserted.
 */
function renderTable( onAddSubscribers = jest.fn() ) {
	render(
		<SubscribersDataViews
			onAddSubscribers={ onAddSubscribers }
			onViewSubscriber={ jest.fn() }
			onSubscribersRemoved={ jest.fn() }
		/>
	);
}

describe( 'SubscribersDataViews', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// The view hydrates from the URL, so reset it between tests that set filters/search.
		window.history.replaceState( {}, '', '/' );
	} );

	it( 'renders the viewer as a row when they are the only subscriber', () => {
		mockResponse();
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '1' );
		expect( screen.queryByTestId( 'empty-state' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the pagination totals intact for a self-only site', () => {
		// The totals used to be zeroed alongside the hidden row, so the footer read "0 subscribers"
		// while the site had one.
		mockResponse();
		renderTable();

		expect( screen.getByTestId( 'total-items' ) ).toHaveTextContent( '1' );
		expect( screen.getByTestId( 'total-pages' ) ).toHaveTextContent( '1' );
	} );

	it( 'prompts a self-only subscriber to add more, and the CTA opens the modal', () => {
		const onAddSubscribers = jest.fn();
		mockResponse();
		renderTable( onAddSubscribers );

		expect( querySelfOnlyNotice() ).toBeInTheDocument();

		// The package favours the native `.click()` pattern over fireEvent / user-event.
		const cta = screen.getByRole( 'button', { name: 'Add subscribers' } );
		cta.click();
		expect( onAddSubscribers ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'still shows the empty state when the site genuinely has no subscribers', () => {
		mockResponse( { total: 0, pages: 0, subscribers: [], is_owner_subscribed: false } );
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '0' );
		expect( screen.getByTestId( 'empty-state' ) ).toBeInTheDocument();
		expect( querySelfOnlyNotice() ).not.toBeInTheDocument();
	} );

	it( 'renders a single non-viewer subscriber without the prompt', () => {
		mockResponse( { is_owner_subscribed: false } );
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '1' );
		expect( querySelfOnlyNotice() ).not.toBeInTheDocument();
	} );

	it( 'drops the prompt once someone else subscribes', () => {
		mockResponse( {
			total: 2,
			subscribers: [ makeSubscriber(), makeSubscriber( { user_id: 2 } ) ],
		} );
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '2' );
		expect( querySelfOnlyNotice() ).not.toBeInTheDocument();
	} );

	it( 'suppresses the prompt when a filter narrowed the list to one row', () => {
		// A one-row filtered result says nothing about how many subscribers the site has.
		window.history.replaceState( {}, '', '/?filters=email_subscriber' );
		mockResponse();
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '1' );
		expect( querySelfOnlyNotice() ).not.toBeInTheDocument();
	} );

	it( 'suppresses the prompt when a search narrowed the list to one row', () => {
		window.history.replaceState( {}, '', '/?q=rob' );
		mockResponse();
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '1' );
		expect( querySelfOnlyNotice() ).not.toBeInTheDocument();
	} );
} );
