import { render, screen } from '@testing-library/react';
import App from '../app';

jest.mock( '../components/my-jetpack-screen', () => ( {
	__esModule: true,
	default: () => <div data-testid="my-jetpack-screen" />,
} ) );

jest.mock( '@automattic/jetpack-partner-coupon', () => ( {
	__esModule: true,
	isPartnerCouponDismissed: () => false,
	PartnerCouponRedeem: () => <div data-testid="partner-coupon-screen" />,
} ) );

describe( 'App', () => {
	// jsdom doesn't implement scrollTo; ScrollToTop calls it on mount.
	beforeEach( () => {
		window.scrollTo = () => {};
	} );

	it( 'renders the home screen at the default hash route', () => {
		window.location.hash = '';

		render( <App /> );

		expect( screen.getByTestId( 'my-jetpack-screen' ) ).toBeInTheDocument();
	} );

	it( 'renders the home screen for an unknown hash route', () => {
		window.location.hash = '#/not-a-real-route';

		render( <App /> );

		expect( screen.getByTestId( 'my-jetpack-screen' ) ).toBeInTheDocument();
	} );

	it( 'renders the partner coupon screen in place of the routes', () => {
		window.location.hash = '';
		window.myJetpackInitialState.partnerCoupon = {
			coupon: {
				coupon_code: 'JPTST_JPTA_abc123',
				preset: 'JPTA',
				partner: { name: 'Jetpack Test Partner', prefix: 'JPTST' },
				product: { title: 'Jetpack Backup', slug: 'jetpack_backup_daily', features: [] },
			},
			assetBaseUrl: 'https://example.org/wp-content/plugins/jetpack',
		};

		try {
			render( <App /> );

			expect( screen.getByTestId( 'partner-coupon-screen' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'my-jetpack-screen' ) ).not.toBeInTheDocument();
		} finally {
			delete window.myJetpackInitialState.partnerCoupon;
		}
	} );
} );
