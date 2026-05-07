import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
	MAX_BULK_REMOVE,
	useSubscriberRemoveMutation,
} from '../_inc/subscribers/data/use-subscriber-remove-mutation';
import type { Subscriber } from '../_inc/subscribers/data/types';

const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockRecordTracksEvent = jest.fn();
const mockRemoveSubscriber = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		createSuccessNotice: mockCreateSuccessNotice,
		createErrorNotice: mockCreateErrorNotice,
	} ),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '../_inc/subscribers/lib/tracks', () => ( {
	recordTracksEvent: ( ...args: unknown[] ) => mockRecordTracksEvent( ...args ),
} ) );

jest.mock( '../_inc/subscribers/data/api', () => ( {
	removeSubscriber: ( ...args: unknown[] ) => mockRemoveSubscriber( ...args ),
} ) );

const buildSubscriber = ( overrides: Partial< Subscriber > = {} ): Subscriber =>
	( {
		display_name: 'Reader One',
		email_address: 'one@example.com',
		email_subscription_id: 11,
		user_id: 0,
		wpcom_subscription_id: 0,
		plans: [],
		...overrides,
	} ) as Subscriber;

const renderMutation = () => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
	const invalidateSpy = jest.spyOn( queryClient, 'invalidateQueries' );
	const { result } = renderHook( () => useSubscriberRemoveMutation(), { wrapper } );
	return { result, invalidateSpy };
};

beforeEach( () => {
	mockCreateSuccessNotice.mockReset();
	mockCreateErrorNotice.mockReset();
	mockRecordTracksEvent.mockReset();
	mockRemoveSubscriber.mockReset();
} );

describe( 'useSubscriberRemoveMutation', () => {
	it( 'shows the singular snackbar with the subscriber label and invalidates the cache', async () => {
		mockRemoveSubscriber.mockResolvedValue( { ok: true, errors: [] } );
		const subscriber = buildSubscriber( { display_name: 'Reader One' } );

		const { result, invalidateSpy } = renderMutation();
		await act( async () => {
			await result.current.mutateAsync( [ subscriber ] );
		} );

		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockCreateSuccessNotice.mock.calls[ 0 ][ 0 ] ).toContain( 'Reader One' );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
		expect( mockRecordTracksEvent ).toHaveBeenCalledWith(
			'jetpack_subscribers_subscriber_removed',
			expect.objectContaining( { subscription_id: 11, user_id: 0 } )
		);
	} );

	it( 'pluralizes the success snackbar for bulk removals', async () => {
		mockRemoveSubscriber.mockResolvedValue( { ok: true, errors: [] } );
		const subscribers = [
			buildSubscriber( { display_name: 'Reader One', email_subscription_id: 11 } ),
			buildSubscriber( { display_name: 'Reader Two', email_subscription_id: 12 } ),
			buildSubscriber( { display_name: 'Reader Three', email_subscription_id: 13 } ),
		];

		const { result } = renderMutation();
		await act( async () => {
			await result.current.mutateAsync( subscribers );
		} );

		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockCreateSuccessNotice.mock.calls[ 0 ][ 0 ] ).toContain( '3' );
		expect( mockRecordTracksEvent ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'reports both success and error notices when the cascade is partial', async () => {
		const subscribers = [
			buildSubscriber( { display_name: 'Worked', email_subscription_id: 21 } ),
			buildSubscriber( { display_name: 'Server failure', email_subscription_id: 22 } ),
			buildSubscriber( { display_name: 'Threw', email_subscription_id: 23 } ),
		];
		mockRemoveSubscriber
			.mockResolvedValueOnce( { ok: true, errors: [] } )
			.mockResolvedValueOnce( {
				ok: false,
				errors: [ { step: 'delete_email_follower', id: '22', error: 'WP.com 500' } ],
			} )
			.mockRejectedValueOnce( new Error( 'Network down' ) );

		const { result } = renderMutation();
		await act( async () => {
			await result.current.mutateAsync( subscribers );
		} );

		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateErrorNotice.mock.calls[ 0 ][ 0 ] ).toContain( '2' );
		expect( mockRecordTracksEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'caps the input at MAX_BULK_REMOVE so a runaway selection cannot overload WP.com', async () => {
		mockRemoveSubscriber.mockResolvedValue( { ok: true, errors: [] } );
		const oversized = Array.from( { length: MAX_BULK_REMOVE + 5 }, ( _, index ) =>
			buildSubscriber( { display_name: `Reader ${ index }`, email_subscription_id: 100 + index } )
		);

		const { result } = renderMutation();
		await act( async () => {
			await result.current.mutateAsync( oversized );
		} );

		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockRemoveSubscriber ).toHaveBeenCalledTimes( MAX_BULK_REMOVE );
	} );
} );
