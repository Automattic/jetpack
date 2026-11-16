/* eslint-disable testing-library/prefer-user-event -- user-event is not a dependency of this package. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import BulkRemoveModal from '../_inc/subscribers/components/modals/bulk-remove-modal';
import type { SubscribersExportQuery } from '../_inc/subscribers/data/types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const mockMutateAsync = jest.fn();
const mockRefetch = jest.fn();
const mockRecordTracksEvent = jest.fn();
const mockCounts: Record< string, { total: number; paid: number } > = {};
const mockCountStates: Record< string, { fetchStatus?: string; isError?: boolean } > = {};

jest.mock( '../_inc/subscribers/data/use-bulk-remove', () => ( {
	useBulkRemoveCounts: ( { filters, enabled }: { filters: string[]; enabled: boolean } ) => {
		const key = filters.filter( filter => filter !== 'all' ).join( ',' ) || 'all';
		const data = enabled ? mockCounts[ key ] : undefined;
		const state = mockCountStates[ key ] ?? {};
		return {
			data,
			isLoading: enabled && ! data,
			isSuccess: !! data && ! state.isError,
			isError: state.isError ?? false,
			fetchStatus: state.fetchStatus ?? 'idle',
			isFetching: state.fetchStatus === 'fetching',
			isPaused: state.fetchStatus === 'paused',
			refetch: mockRefetch,
		};
	},
	useStartBulkRemoveMutation: () => ( { mutateAsync: mockMutateAsync } ),
} ) );

jest.mock( '../_inc/subscribers/lib/tracks', () => ( {
	recordTracksEvent: ( ...args: unknown[] ) => mockRecordTracksEvent( ...args ),
} ) );

const wholeList: SubscribersExportQuery = {
	filters: [],
	search: '',
	sort: 'date_subscribed',
	sortOrder: 'desc',
};

const filtered: SubscribersExportQuery = { ...wholeList, filters: [ 'free' ], search: 'gmail' };

const renderModal = ( props: Partial< React.ComponentProps< typeof BulkRemoveModal > > = {} ) => {
	const onClose = jest.fn();
	const onChangeScope = jest.fn();
	const modalProps: React.ComponentProps< typeof BulkRemoveModal > = {
		scope: 'all',
		query: wholeList,
		examples: [ 'a@example.com', 'b@example.com', 'c@example.com' ],
		blogId: 123,
		onChangeScope,
		onClose,
		...props,
	};
	const view = render( <BulkRemoveModal { ...modalProps } /> );
	return {
		onClose,
		onChangeScope,
		rerender: () => view.rerender( <BulkRemoveModal { ...modalProps } /> ),
	};
};

const confirmButton = () =>
	screen.getByRole( 'button', { name: /^Remove ([\d,]+ )?subscribers?$/ } );

beforeEach( () => {
	jest.clearAllMocks();
	Object.keys( mockCountStates ).forEach( key => delete mockCountStates[ key ] );
	mockCounts.all = { total: 15000, paid: 12 };
	mockCounts.free = { total: 1200, paid: 0 };
} );

describe( 'BulkRemoveModal', () => {
	it( 'renders nothing while closed', () => {
		renderModal( { scope: null } );

		expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	it( 'states the count and the paid subscriptions it cancels', () => {
		renderModal();

		expect( screen.getByText( 'Remove all 15,000 subscribers?' ) ).toBeInTheDocument();
		expect(
			screen.getByText( /12 paid subscribers will have their subscriptions cancelled/, {
				exact: false,
			} )
		).toBeInTheDocument();
		expect(
			screen.getByText( /This can’t be undone, and we can’t bring them back for you\./ )
		).toBeInTheDocument();
		expect( screen.getByLabelText( 'Type 15000 to confirm' ) ).toBeInTheDocument();
		expect( confirmButton() ).toHaveTextContent( /^Remove 15,000 subscribers$/ );
	} );

	it( 'does not start until the count is typed', async () => {
		renderModal();

		fireEvent.change( screen.getByLabelText( 'Type 15000 to confirm' ), {
			target: { value: '1500' },
		} );
		fireEvent.click( confirmButton() );

		expect( mockMutateAsync ).not.toHaveBeenCalled();
		// The dialog shows the error and also announces it to screen readers.
		await expect( screen.findAllByText( 'Type 15,000 to confirm.' ) ).resolves.not.toHaveLength(
			0
		);
	} );

	it( 'starts the whole-list removal with the typed count, commas allowed', async () => {
		mockMutateAsync.mockResolvedValue( null );
		const { onClose } = renderModal();

		fireEvent.change( screen.getByLabelText( 'Type 15000 to confirm' ), {
			target: { value: '15,000' },
		} );
		fireEvent.click( confirmButton() );

		await waitFor( () =>
			expect( mockMutateAsync ).toHaveBeenCalledWith(
				expect.objectContaining( { scope: 'all', expectedCount: 15000 } )
			)
		);
		expect( onClose ).toHaveBeenCalled();
		expect( mockRecordTracksEvent ).toHaveBeenCalledWith(
			'jetpack_subscribers_bulk_remove_confirmed',
			expect.objectContaining( { scope: 'all', total: 15000, paid: 12 } )
		);
	} );

	const stillCountingText = 'Still counting your subscribers. Try again in a moment.';
	const failedText = 'Could not count your subscribers. Close this and try again.';

	it.each( [
		[ 'fetching', false ],
		[ 'paused', false ],
		[ 'fetching after an error', true ],
	] )(
		'blocks cached counts while their refresh is %s, then clears the message once they load',
		async ( label, isError ) => {
			const fetchStatus = label === 'paused' ? 'paused' : 'fetching';
			const { rerender, onClose } = renderModal();
			fireEvent.change( screen.getByLabelText( 'Type 15000 to confirm' ), {
				target: { value: '15000' },
			} );
			mockCountStates.all = { fetchStatus, isError };
			rerender();
			// The button drops the cached count, and clicking says why nothing happens.
			expect( confirmButton() ).toHaveTextContent( /^Remove subscribers$/ );
			fireEvent.click( confirmButton() );

			await expect( screen.findByText( stillCountingText ) ).resolves.toBeInTheDocument();
			expect( speak ).toHaveBeenCalledWith( stillCountingText, 'assertive' );
			// A retry after a failure is still counting, so the old failure is not shown beside it.
			expect( screen.queryByText( failedText ) ).not.toBeInTheDocument();
			expect( mockMutateAsync ).not.toHaveBeenCalled();
			expect( onClose ).not.toHaveBeenCalled();

			delete mockCountStates.all;
			rerender();
			expect( screen.queryByText( stillCountingText ) ).not.toBeInTheDocument();
			expect( confirmButton() ).toHaveTextContent( /^Remove 15,000 subscribers$/ );
		}
	);

	it.each( [ 'idle', 'paused' ] )(
		'blocks cached counts when their refresh failed and is %s, and says so once on confirm',
		async fetchStatus => {
			const { rerender, onClose } = renderModal();
			fireEvent.change( screen.getByLabelText( 'Type 15000 to confirm' ), {
				target: { value: '15000' },
			} );
			mockCountStates.all = { fetchStatus, isError: true };
			rerender();
			expect( confirmButton() ).toHaveTextContent( /^Remove subscribers$/ );
			fireEvent.click( confirmButton() );

			await waitFor( () => expect( speak ).toHaveBeenCalledWith( failedText, 'assertive' ) );
			expect( screen.getAllByText( failedText ) ).toHaveLength( 1 );
			expect( screen.queryByText( /Still counting your subscribers/ ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Counting your subscribers…' ) ).not.toBeInTheDocument();
			expect( mockMutateAsync ).not.toHaveBeenCalled();
			expect( onClose ).not.toHaveBeenCalled();
		}
	);

	it( 'lists what matches, with examples, when removing the matches', () => {
		renderModal( { scope: 'matching', query: filtered } );

		expect( screen.getByText( 'Remove 1,200 matching subscribers?' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Name or email contains “gmail”' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Subscription type is Free' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'For example a@example.com, b@example.com, c@example.com, and 1,197 more.' )
		).toBeInTheDocument();
		expect( screen.getByText( /The other 13,800 stay on your list\./ ) ).toBeInTheDocument();
	} );

	it.each( [ 'fetching', 'paused', 'error', 'missing' ] )(
		'leaves out how many stay when the whole-list count is %s',
		state => {
			mockCountStates.all = {
				fetchStatus: state === 'error' || state === 'missing' ? 'idle' : state,
				isError: state === 'error',
			};
			if ( state === 'missing' ) {
				delete mockCounts.all;
			}
			renderModal( { scope: 'matching', query: filtered } );

			expect( screen.getByText( 'Remove 1,200 matching subscribers?' ) ).toBeInTheDocument();
			expect( screen.queryByText( /stays? on your list/ ) ).not.toBeInTheDocument();
		}
	);

	it( 'warns that Remove all ignores the search and filters, and offers the matches instead', () => {
		const { onChangeScope } = renderModal( { scope: 'all', query: filtered } );

		expect(
			screen.getByText( /This removes everyone on your list, not only the 1,200 that match/ )
		).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove only the 1,200 matching subscribers instead' } )
		);
		expect( onChangeScope ).toHaveBeenCalledWith( 'matching' );
	} );

	it.each( [ 'fetching', 'paused', 'error', 'missing' ] )(
		'keeps the whole-list warning when matching counts are %s',
		state => {
			mockCountStates.free = {
				fetchStatus: state === 'error' || state === 'missing' ? 'idle' : state,
				isError: state === 'error',
			};
			if ( state === 'missing' ) {
				delete mockCounts.free;
			}
			renderModal( { scope: 'all', query: filtered } );

			expect(
				screen.getByText(
					'This removes everyone on your list, regardless of your current search or filters.'
				)
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: /Remove only the .* matching/ } )
			).not.toBeInTheDocument();
		}
	);

	it( 'keeps the CSV button in place after a download, so focus is not lost', () => {
		const open = jest.spyOn( window, 'open' ).mockImplementation( () => null );
		renderModal();

		const button = screen.getByRole( 'button', { name: 'download all your subscribers as a CSV' } );
		fireEvent.click( button );

		expect( open ).toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Download it again' } ) ).toBe( button );
		open.mockRestore();
	} );

	it( 'asks again when the list changed since the dialog opened', async () => {
		mockMutateAsync.mockRejectedValue( {
			code: 'bulk_remove_count_changed',
			data: { status: 409, count: 15003 },
		} );
		const { onClose } = renderModal();

		fireEvent.change( screen.getByLabelText( 'Type 15000 to confirm' ), {
			target: { value: '15000' },
		} );
		fireEvent.click( confirmButton() );

		await expect(
			screen.findAllByText( /Your list changed while this was open\. It now has 15,003/ )
		).resolves.not.toHaveLength( 0 );
		expect( mockRefetch ).toHaveBeenCalled();
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'closes to show the running removal when one is already going', async () => {
		mockMutateAsync.mockRejectedValue( { code: 'bulk_remove_in_progress', data: { status: 409 } } );
		const { onClose } = renderModal();

		fireEvent.change( screen.getByLabelText( 'Type 15000 to confirm' ), {
			target: { value: '15000' },
		} );
		fireEvent.click( confirmButton() );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
	} );
} );
