import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAddSubscribersMutation } from '../_inc/subscribers/data/use-add-subscribers-mutation';

const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockAddSubscribers = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		createSuccessNotice: mockCreateSuccessNotice,
		createErrorNotice: mockCreateErrorNotice,
	} ),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '../_inc/subscribers/data/api', () => ( {
	addSubscribers: ( ...args: unknown[] ) => mockAddSubscribers( ...args ),
} ) );

const renderMutation = () => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
	const invalidateSpy = jest.spyOn( queryClient, 'invalidateQueries' );
	const { result } = renderHook( () => useAddSubscribersMutation(), { wrapper } );
	return { result, invalidateSpy };
};

beforeEach( () => {
	mockCreateSuccessNotice.mockReset();
	mockCreateErrorNotice.mockReset();
	mockAddSubscribers.mockReset();
} );

describe( 'useAddSubscribersMutation', () => {
	it( 'forwards selected category ids alongside the emails', async () => {
		mockAddSubscribers.mockResolvedValue( { upload_id: 99 } );

		const { result, invalidateSpy } = renderMutation();
		await act( async () => {
			await result.current.mutateAsync( {
				emails: [ 'one@example.com', 'two@example.com' ],
				categories: [ 3, 8 ],
			} );
		} );

		expect( mockAddSubscribers ).toHaveBeenCalledWith(
			[ 'one@example.com', 'two@example.com' ],
			[ 3, 8 ]
		);
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
		// The snackbar counts emails, not categories.
		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockCreateSuccessNotice.mock.calls[ 0 ][ 0 ] ).toContain( '2' );
	} );

	it( 'passes undefined categories through untouched for a plain import', async () => {
		mockAddSubscribers.mockResolvedValue( { upload_id: 100 } );

		const { result } = renderMutation();
		await act( async () => {
			await result.current.mutateAsync( { emails: [ 'reader@example.com' ] } );
		} );

		expect( mockAddSubscribers ).toHaveBeenCalledWith( [ 'reader@example.com' ], undefined );
	} );

	it( 'surfaces an error notice when the import fails', async () => {
		mockAddSubscribers.mockRejectedValue( new Error( 'Import limit reached.' ) );

		const { result } = renderMutation();
		await act( async () => {
			await result.current
				.mutateAsync( { emails: [ 'reader@example.com' ], categories: [] } )
				.catch( () => undefined );
		} );

		await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockCreateErrorNotice.mock.calls[ 0 ][ 0 ] ).toBe( 'Import limit reached.' );
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );
} );
