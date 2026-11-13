/* eslint-disable testing-library/prefer-user-event -- user-event is not a dependency of this package. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SubscribersDataViews from '../_inc/subscribers/components/subscribers-data-views';
import { useSubscribers } from '../_inc/subscribers/data/use-subscribers';
import type { Subscriber } from '../_inc/subscribers/data/types';

const mockRemove = jest.fn();

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
jest.mock( '../_inc/subscribers/data/use-subscribers', () => ( {
	useSubscribers: jest.fn(),
} ) );
jest.mock( '../_inc/subscribers/data/use-subscriber-remove-mutation', () => ( {
	useSubscriberRemoveMutation: () => ( { mutateAsync: mockRemove } ),
} ) );
jest.mock( '../_inc/subscribers/data/use-memberships-products', () => ( {
	useMembershipsProducts: () => ( { data: [], isError: false } ),
} ) );
jest.mock( '../_inc/subscribers/data/use-send-bounce-confirmation-mutation', () => ( {
	useSendBounceConfirmationMutation: () => ( { mutate: jest.fn() } ),
} ) );
jest.mock( '../_inc/subscribers/lib/tracks', () => ( { recordTracksEvent: jest.fn() } ) );
jest.mock( '@automattic/jetpack-components/gravatar', () => ( {
	__esModule: true,
	default: () => null,
} ) );
jest.mock( '../_inc/subscribers/components/modals/comp-modal', () => () => null );
jest.mock( '../_inc/subscribers/components/modals/remove-comp-modal', () => () => null );

const subscriber: Subscriber = {
	user_id: 1,
	display_name: 'Reader',
	email_address: 'reader@example.org',
	subscription_status: 'Subscribed',
};
const loaded = {
	data: { subscribers: [ subscriber ], total: 21, pages: 2, page: 2, per_page: 20 },
	isLoading: false,
	isPlaceholderData: false,
	error: null,
};
const props = {
	onAddSubscribers: jest.fn(),
	onViewSubscriber: jest.fn(),
	onSubscribersRemoved: jest.fn(),
	onSelfOnlyChange: jest.fn(),
	onQueryChange: jest.fn(),
	onListChange: jest.fn(),
	onRequestBulkRemove: jest.fn(),
	isBulkRemoveRunning: false,
	isBulkRemoveEnabled: true,
};

beforeEach( () => {
	jest.clearAllMocks();
	window.history.replaceState( {}, '', '/?paged=2' );
	jest.mocked( useSubscribers ).mockReturnValue( loaded );
} );

it.each( [ 'row', 'page' ] )( 'closes a pending %s removal while a bulk job runs', async source => {
	const { rerender } = render( <SubscribersDataViews { ...props } /> );
	if ( source === 'row' ) {
		fireEvent.click( screen.getByRole( 'button', { name: 'Actions', exact: true } ) );
		fireEvent.click( await screen.findByRole( 'menuitem', { name: 'Remove subscriber' } ) );
	} else {
		fireEvent.click( screen.getByRole( 'checkbox', { name: 'Select all', exact: true } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Remove subscriber', exact: true } ) );
	}
	expect( screen.getByRole( 'alertdialog', { name: 'Remove Reader?' } ) ).toBeInTheDocument();

	rerender( <SubscribersDataViews { ...props } isBulkRemoveRunning /> );
	expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'Actions', exact: true } ) );
	await expect(
		screen.findByRole( 'menuitem', { name: 'Remove subscriber' } )
	).resolves.toHaveAttribute( 'aria-disabled', 'true' );
	expect( mockRemove ).not.toHaveBeenCalled();

	rerender( <SubscribersDataViews { ...props } /> );
	expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
} );

it( 'keeps a final-page row removal separate from removing the whole selection', async () => {
	render( <SubscribersDataViews { ...props } /> );
	fireEvent.click( screen.getByRole( 'checkbox', { name: 'Select all', exact: true } ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Select all 21 subscribers' } ) );
	expect(
		screen.queryByRole( 'button', { name: 'Remove subscriber', exact: true } )
	).not.toBeInTheDocument();

	fireEvent.click( screen.getByRole( 'button', { name: 'Actions', exact: true } ) );
	fireEvent.click( await screen.findByRole( 'menuitem', { name: 'Remove subscriber' } ) );
	expect( screen.getByRole( 'alertdialog', { name: 'Remove Reader?' } ) ).toBeInTheDocument();
	expect( props.onRequestBulkRemove ).not.toHaveBeenCalled();
	fireEvent.click( screen.getByRole( 'button', { name: 'Cancel', exact: true } ) );
	await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );

	fireEvent.click( screen.getByRole( 'button', { name: 'Remove 21 subscribers', exact: true } ) );
	expect( props.onRequestBulkRemove ).toHaveBeenCalledWith( 'all' );
} );

it( 'keeps the table bulk action for a selection spanning multiple rows', async () => {
	jest.mocked( useSubscribers ).mockReturnValue( {
		...loaded,
		data: {
			...loaded.data,
			subscribers: [ subscriber, { ...subscriber, user_id: 2 } ],
		},
	} );
	render( <SubscribersDataViews { ...props } /> );
	fireEvent.click( screen.getByRole( 'checkbox', { name: 'Select all', exact: true } ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Select all 21 subscribers' } ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Remove subscriber', exact: true } ) );
	await waitFor( () =>
		expect(
			screen.getByRole( 'button', { name: 'Remove subscriber', exact: true } )
		).not.toHaveAttribute( 'aria-disabled', 'true' )
	);
	expect( props.onRequestBulkRemove ).toHaveBeenCalledWith( 'all' );
	expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
} );

it( 'clears the previous count and examples while a new search is loading', async () => {
	const { rerender } = render( <SubscribersDataViews { ...props } /> );
	expect( props.onListChange ).toHaveBeenLastCalledWith( {
		total: 21,
		examples: [ 'reader@example.org' ],
	} );
	jest.mocked( useSubscribers ).mockReturnValue( { ...loaded, isPlaceholderData: true } );
	fireEvent.change( screen.getByRole( 'searchbox' ), { target: { value: 'fan' } } );
	await waitFor( () =>
		expect( props.onQueryChange ).toHaveBeenLastCalledWith(
			expect.objectContaining( { search: 'fan' } )
		)
	);
	expect( props.onListChange ).toHaveBeenLastCalledWith( { total: 0, examples: [] } );

	jest.mocked( useSubscribers ).mockReturnValue( {
		...loaded,
		data: {
			...loaded.data,
			total: 1,
			subscribers: [ { ...subscriber, email_address: 'fan@example.org' } ],
		},
	} );
	rerender( <SubscribersDataViews { ...props } /> );
	expect( props.onListChange ).toHaveBeenLastCalledWith( {
		total: 1,
		examples: [ 'fan@example.org' ],
	} );
} );
