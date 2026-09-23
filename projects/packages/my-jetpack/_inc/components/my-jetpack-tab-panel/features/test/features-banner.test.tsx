import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { FeaturesBanner } from '../features-banner';

jest.mock( '@wordpress/api-fetch' );

const mockRecordEvent = jest.fn();
jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const TITLE = 'Every Jetpack feature, in one place.';

const renderBanner = ( client: QueryClient ) =>
	render(
		<QueryClientProvider client={ client }>
			<FeaturesBanner />
		</QueryClientProvider>
	);

const newClient = () =>
	new QueryClient( { defaultOptions: { queries: { retry: false }, mutations: { retry: false } } } );

describe( 'FeaturesBanner', () => {
	beforeEach( () => {
		window.myJetpackInitialState = {
			featuresBanner: { isDismissed: false },
		} as Window[ 'myJetpackInitialState' ];
		mockApiFetch.mockReset();
		mockRecordEvent.mockReset();
	} );

	it( 'renders nothing for a user who already dismissed it', () => {
		window.myJetpackInitialState.featuresBanner = { isDismissed: true };

		renderBanner( newClient() );

		expect( screen.queryByText( TITLE ) ).not.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'hides on dismiss, saves it, and stays hidden when the tab remounts it', async () => {
		mockApiFetch.mockResolvedValue( true );
		const client = newClient();
		const { unmount } = renderBanner( client );

		expect( screen.getByText( TITLE ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss banner' } ) );

		expect( screen.queryByText( TITLE ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wpcom/v2/my-jetpack/site/features/banner/dismiss',
				method: 'POST',
			} )
		);
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_features_banner_dismiss',
			{}
		);

		unmount();
		renderBanner( client );

		expect( screen.queryByText( TITLE ) ).not.toBeInTheDocument();
	} );

	it( 'comes back when the dismissal fails to save', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'offline' ) );
		renderBanner( newClient() );

		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss banner' } ) );

		await expect( screen.findByText( TITLE ) ).resolves.toBeInTheDocument();
	} );
} );
