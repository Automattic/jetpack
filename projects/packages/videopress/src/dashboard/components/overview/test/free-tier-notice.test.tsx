import analytics from '@automattic/jetpack-analytics';
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreeTierNotice from '../free-tier-notice';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@automattic/jetpack-connection/hooks/use-product-checkout-workflow', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedCheckoutWorkflow = useProductCheckoutWorkflow as jest.Mock;
const mockedAnalytics = analytics as unknown as {
	tracks: { recordEvent: jest.Mock };
};

const setInitialState = ( state: unknown ) => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE =
		state;
};

const DEFAULT_STATE = {
	product: { slug: 'jetpack_videopress' },
	siteData: { adminUrl: 'https://example.com/wp-admin/' },
};

let mockRun: jest.Mock;

describe( 'FreeTierNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setInitialState( DEFAULT_STATE );
		mockRun = jest.fn();
		mockedCheckoutWorkflow.mockReturnValue( { run: mockRun } );
	} );

	it( 'drives the shared checkout workflow with the VideoPress product and redirect', () => {
		render( <FreeTierNotice /> );

		expect( mockedCheckoutWorkflow ).toHaveBeenCalledWith( {
			productSlug: 'jetpack_videopress',
			redirectUrl: 'https://example.com/wp-admin/admin.php?page=jetpack-videopress',
			useBlogIdSuffix: true,
			from: 'jetpack-videopress',
		} );
	} );

	it( 'records the upgrade-click Tracks event and runs the workflow on click', async () => {
		const user = userEvent.setup();
		render( <FreeTierNotice /> );

		const link = screen.getByRole( 'link', { name: 'Upgrade' } );
		// The CTA is an anchor with a placeholder href; the real `run` cancels the
		// default before redirecting, but `run` is mocked here, so cancel it
		// ourselves to keep jsdom from attempting navigation.
		link.addEventListener( 'click', event => event.preventDefault() );
		await user.click( link );

		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_upgrade_trigger_link_click'
		);
		expect( mockRun ).toHaveBeenCalledTimes( 1 );
	} );
} );
