// The Subscribers table used to hide the viewer's own subscription: when they were the only
// subscriber the component swapped that single row for the cold-start empty state, so a brand-new
// creator read "No subscribers yet" on a site that already had one (NL-772). Every row WP.com
// returns is a real subscription, so these tests pin the table to rendering exactly what the
// endpoint sends, and reserve the empty slot for a genuinely empty response.

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
 */
function renderTable() {
	render(
		<SubscribersDataViews
			onAddSubscribers={ jest.fn() }
			onViewSubscriber={ jest.fn() }
			onSubscribersRemoved={ jest.fn() }
		/>
	);
}

describe( 'SubscribersDataViews', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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

	it( 'still shows the empty state when the site genuinely has no subscribers', () => {
		mockResponse( { total: 0, pages: 0, subscribers: [], is_owner_subscribed: false } );
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '0' );
		expect( screen.getByTestId( 'empty-state' ) ).toBeInTheDocument();
	} );

	it( 'renders every row the endpoint returns', () => {
		mockResponse( {
			total: 2,
			subscribers: [ makeSubscriber(), makeSubscriber( { user_id: 2 } ) ],
		} );
		renderTable();

		expect( screen.getByTestId( 'row-count' ) ).toHaveTextContent( '2' );
	} );
} );
