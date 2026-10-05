import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import App from '../app';
import useMyJetpackConnection from '../hooks/use-my-jetpack-connection';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../hooks/use-my-jetpack-connection' );

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
		useMyJetpackConnection.mockReset();
		useMyJetpackConnection.mockReturnValue( {} );
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

	it( 'keeps offline entry and reload inside Features with its query and without connected queries', async () => {
		const initial = window.myJetpackInitialState;
		const scriptData = window.JetpackScriptData;
		const local = { jetpack: 'inactive', features: [] };
		const query = '?view=list&filter=inactive&search=sitemaps&feature=forms';
		window.myJetpackInitialState = {
			isOfflineFeatures: '1',
			products: { items: {} },
			myJetpackFlags: {},
			partnerCoupon: { coupon: {}, assetBaseUrl: '' },
		};
		window.JetpackScriptData = {
			site: { admin_url: 'http://example.org/wp-admin/' },
			myJetpack: { offlineFeatures: { mainFeatures: local, plugins: {} } },
		};
		apiFetch.mockResolvedValue( local );
		useMyJetpackConnection.mockImplementation( () => {
			throw new Error( 'Offline Features mounted a connection hook.' );
		} );

		try {
			for ( const entry of [ '/features', '/', '/connection' ] ) {
				window.location.hash = `#${ entry }${ query }`;
				for ( let load = 0; load < 2; load++ ) {
					apiFetch.mockClear();
					const view = render( <App /> );
					await waitFor( () => expect( window.location.hash ).toBe( `#/features${ query }` ) );
					await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
					expect( apiFetch ).toHaveBeenCalledWith( { path: '/wpcom/v2/my-jetpack/site/features' } );
					expect( screen.getByRole( 'heading', { name: 'Features' } ) ).toBeInTheDocument();
					expect( screen.queryByTestId( 'partner-coupon-screen' ) ).not.toBeInTheDocument();
					expect( screen.queryByTestId( 'my-jetpack-screen' ) ).not.toBeInTheDocument();
					expect( useMyJetpackConnection ).not.toHaveBeenCalled();
					view.unmount();
				}
			}
		} finally {
			window.myJetpackInitialState = initial;
			window.JetpackScriptData = scriptData;
			useMyJetpackConnection.mockReset();
		}
	} );
} );
