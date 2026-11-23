import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { ConnectError } from '../../../use-connection/types';

const checkoutState: { checkoutError: string | null } = { checkoutError: null };
const connectionState: { connectError: ConnectError | false } = { connectError: false };
jest.unstable_mockModule( '../../../use-connection', () => ( {
	__esModule: true,
	default: () => ( {
		handleRegisterSite: jest.fn(),
		siteIsRegistering: false,
		userIsConnecting: false,
		isOfflineMode: false,
		...connectionState,
	} ),
} ) );
jest.unstable_mockModule( '../../../../hooks/use-product-checkout-workflow', () => ( {
	__esModule: true,
	default: () => ( { run: jest.fn(), hasCheckoutStarted: false, ...checkoutState } ),
} ) );

const ConnectScreenRequiredPlan = ( await import( '../index' ) ).default;

const props = {
	pricingTitle: 'Jetpack Backup',
	priceBefore: 9,
	priceAfter: 4.5,
	wpcomProductSlug: 'jetpack_backup_t1_yearly',
	redirectUri: 'admin.php?page=jetpack-backup',
	from: 'jetpack-backup',
	apiRoot: '/wp-json/',
	apiNonce: 'nonce',
	registrationNonce: 'nonce',
};

describe( 'ConnectScreenRequiredPlan container', () => {
	afterEach( () => {
		connectionState.connectError = false;
	} );

	it( 'explains a failed hand-off to WordPress.com', () => {
		connectionState.connectError = { name: 'Api404Error' };
		render( <ConnectScreenRequiredPlan { ...props } /> );

		expect( screen.getByText( /REST API couldn’t be reached/ ) ).toBeInTheDocument();
	} );

	it( 'shows an error when the checkout workflow fails', () => {
		checkoutState.checkoutError = 'Lookup failed';
		render( <ConnectScreenRequiredPlan { ...props } /> );

		expect( screen.getByText( 'An error occurred. Please try again.' ) ).toBeInTheDocument();
	} );

	it( 'shows no error otherwise', () => {
		checkoutState.checkoutError = null;
		render( <ConnectScreenRequiredPlan { ...props } /> );

		expect( screen.getByText( 'Jetpack Backup' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'An error occurred. Please try again.' ) ).not.toBeInTheDocument();
	} );
} );
