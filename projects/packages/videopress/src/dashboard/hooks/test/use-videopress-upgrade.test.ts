import analytics from '@automattic/jetpack-analytics';
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { act, renderHook } from '@testing-library/react';
import { useVideoPressUpgrade } from '../use-videopress-upgrade';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@automattic/jetpack-connection/hooks/use-product-checkout-workflow', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedCheckout = useProductCheckoutWorkflow as jest.Mock;
const mockedAnalytics = analytics as unknown as { tracks: { recordEvent: jest.Mock } };

const setInitialState = ( state: unknown ) => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE =
		state;
};

describe( 'useVideoPressUpgrade', () => {
	let mockRun: jest.Mock;

	beforeEach( () => {
		jest.clearAllMocks();
		setInitialState( { product: { slug: 'jetpack_videopress' } } );
		mockRun = jest.fn();
		mockedCheckout.mockReturnValue( { run: mockRun } );
	} );

	it( 'configures the checkout workflow with the VideoPress product and redirect', () => {
		renderHook( () => useVideoPressUpgrade() );

		expect( mockedCheckout ).toHaveBeenCalledWith( {
			productSlug: 'jetpack_videopress',
			redirectUrl: 'admin.php?page=jetpack-videopress',
			useBlogIdSuffix: true,
			from: 'jetpack-videopress',
		} );
	} );

	it( 'records the upgrade-click event and runs the workflow when invoked', async () => {
		const { result } = renderHook( () => useVideoPressUpgrade() );

		await act( async () => {
			result.current();
			// `run` is deferred to a microtask so the Tracks pixel fires first.
			await Promise.resolve();
		} );

		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_upgrade_trigger_link_click'
		);
		expect( mockRun ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'falls back to an empty product slug when initial state is absent', () => {
		setInitialState( undefined );

		renderHook( () => useVideoPressUpgrade() );

		expect( mockedCheckout ).toHaveBeenCalledWith( expect.objectContaining( { productSlug: '' } ) );
	} );
} );
