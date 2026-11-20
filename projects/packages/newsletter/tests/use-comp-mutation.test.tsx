import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useCompMutation } from '../_inc/subscribers/data/use-comp-mutation';

const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockAddComp = jest.fn();

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
	addComp: ( ...args: unknown[] ) => mockAddComp( ...args ),
	removeComp: jest.fn(),
} ) );

const renderMutation = () => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
	const invalidateSpy = jest.spyOn( queryClient, 'invalidateQueries' );
	const { result } = renderHook( () => useCompMutation(), { wrapper } );
	return { result, invalidateSpy };
};

beforeEach( () => {
	mockCreateSuccessNotice.mockReset();
	mockCreateErrorNotice.mockReset();
	mockAddComp.mockReset();
	mockAddComp.mockResolvedValue( {} );
} );

describe( 'useCompMutation', () => {
	it( 'sends the user id when the subscriber has a wpcom account', async () => {
		const { result } = renderMutation();

		await act( async () => {
			await result.current.mutateAsync( { user_id: 229907063, plan_id: 51 } );
		} );

		expect( mockAddComp ).toHaveBeenCalledWith( {
			user_id: 229907063,
			plan_id: 51,
			no_expiration: undefined,
		} );
	} );

	it( 'sends the email instead of a zero user id for an email-only subscriber', async () => {
		const { result } = renderMutation();

		await act( async () => {
			await result.current.mutateAsync( {
				user_id: 0,
				email: 'reader@example.com',
				plan_id: 51,
				no_expiration: true,
			} );
		} );

		expect( mockAddComp ).toHaveBeenCalledWith( {
			email: 'reader@example.com',
			plan_id: 51,
			no_expiration: true,
		} );
	} );

	it( 'invalidates the detail queries so a newly linked user id is picked up', async () => {
		const { result, invalidateSpy } = renderMutation();

		await act( async () => {
			await result.current.mutateAsync( { email: 'reader@example.com', plan_id: 51 } );
		} );

		await waitFor( () =>
			expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscriber-details' ] } )
		);
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
	} );
} );
