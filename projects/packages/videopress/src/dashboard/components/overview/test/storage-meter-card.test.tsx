import { render, screen, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';
import StorageMeterCard from '../storage-meter-card';

// Control the unlimited flag directly; its own logic is covered by the hook's tests.
let mockUnlimited = false;
jest.mock( '../../../hooks/use-is-videopress-unlimited', () => ( {
	useIsVideoPressUnlimited: () => mockUnlimited,
} ) );

// useSite fetches /videopress/v1/site; return a fixed used-storage payload.
const mockSiteResponse = ( usedMb: number ) =>
	mockApiFetch( async () => ( {
		options: { videopress_storage_used: usedMb, is_wpcom_atomic: false },
	} ) );

const renderCard = () => render( <StorageMeterCard />, { wrapper: createTestWrapper() } );

describe( 'StorageMeterCard', () => {
	afterEach( () => {
		mockUnlimited = false;
	} );

	it( 'shows a 1 TB denominator for non-unlimited sites', async () => {
		mockUnlimited = false;
		mockSiteResponse( 500000 ); // 0.5 TB used

		renderCard();

		// 0.5TB / 1TB = 50%
		await expect(
			screen.findByText( '50% of 1 TB of cloud video storage' )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows a 2 TB denominator for unlimited (grandfathered) sites', async () => {
		mockUnlimited = true;
		mockSiteResponse( 500000 ); // 0.5 TB used

		renderCard();

		// 0.5TB / 2TB = 25%
		await expect(
			screen.findByText( '25% of 2 TB of cloud video storage' )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders nothing when storage usage is zero', async () => {
		mockUnlimited = false;
		mockSiteResponse( 0 );

		const { container } = renderCard();

		// The `! usedBytes` guard returns null; give the query time to settle.
		await waitFor( () => expect( container ).toBeEmptyDOMElement() );
	} );
} );
