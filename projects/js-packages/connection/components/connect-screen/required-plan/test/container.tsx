import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const checkoutState: { checkoutError: string | null } = { checkoutError: null };
jest.unstable_mockModule( '../../../use-connection', () => ( {
	__esModule: true,
	default: () => ( {
		handleRegisterSite: jest.fn(),
		siteIsRegistering: false,
		userIsConnecting: false,
		registrationError: null,
		isOfflineMode: false,
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
	it( 'shows an error when the checkout workflow fails', () => {
		checkoutState.checkoutError = 'Lookup failed';
		render( <ConnectScreenRequiredPlan { ...props } /> );

		expect( screen.getByText( 'An error occurred. Please try again.' ) ).toBeInTheDocument();
	} );

	it( 'shows no error otherwise', () => {
		checkoutState.checkoutError = null;
		render( <ConnectScreenRequiredPlan { ...props } /> );

		expect( screen.queryByText( 'An error occurred. Please try again.' ) ).not.toBeInTheDocument();
	} );
} );
