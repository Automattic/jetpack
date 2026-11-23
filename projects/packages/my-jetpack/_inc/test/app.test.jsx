import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import App from '../app';
import { replaceLocation } from '../components/host-purchase-gate/replace-location';
import useAnalytics from '../hooks/use-analytics';
import useMyJetpackConnection from '../hooks/use-my-jetpack-connection';
import { queryClient } from '../providers';
import { getRouteHref } from '../utils/route-href';

jest.mock( '@wordpress/api-fetch' );
// A stand-in for the boot router: the route lives in `?p=`, its search values JSON-parsed as the
// router parses them, and navigating re-renders its subscribers.
jest.mock( '@wordpress/route', () => {
	const { useSyncExternalStore } = jest.requireActual( 'react' );
	const listeners = new Set();
	const subscribe = listener => {
		listeners.add( listener );
		return () => listeners.delete( listener );
	};
	const useRoute = () => {
		const href = useSyncExternalStore( subscribe, () => globalThis.location.href );
		const [ path, query = '' ] = ( new URL( href ).searchParams.get( 'p' ) || '/' ).split( '?' );
		return { path, query };
	};
	const parse = value => {
		try {
			return JSON.parse( value );
		} catch {
			return value;
		}
	};
	const navigate = ( { href, replace } ) => {
		const url = new URL( globalThis.location.href );
		url.searchParams.set( 'p', href );
		globalThis.history[ replace ? 'replaceState' : 'pushState' ]( null, '', url );
		listeners.forEach( listener => listener() );
	};
	return {
		useNavigate: () => navigate,
		useParams: () => ( { _splat: useRoute().path.slice( 1 ) } ),
		useSearch: () =>
			Object.fromEntries(
				[ ...new URLSearchParams( useRoute().query ) ].map( ( [ key, value ] ) => [
					key,
					parse( value ),
				] )
			),
	};
} );
jest.mock( '../hooks/use-my-jetpack-connection' );
const mockRecordEvent = jest.mocked( jest.mocked( useAnalytics )().recordEvent );
jest.mock( '../hooks/use-paid-menu-sync', () => ( { usePaidMenuSync: jest.fn() } ) );

jest.mock( '../components/my-jetpack-screen', () => ( {
	__esModule: true,
	default: () => <div data-testid="my-jetpack-screen" />,
} ) );

jest.mock( '@automattic/jetpack-partner-coupon', () => ( {
	__esModule: true,
	isPartnerCouponDismissed: () => false,
	PartnerCouponRedeem: () => <div data-testid="partner-coupon-screen" />,
} ) );

jest.mock( '../components/product-interstitial/pricing-interstitial', () => ( {
	__esModule: true,
	default: ( { slug } ) => <div data-testid="pricing-page">{ slug }</div>,
} ) );
jest.mock( '../components/host-purchase-gate/replace-location' );

/**
 * Point the page at a route the way the boot router stores it.
 *
 * @param {string} href - The route, such as `/connection`; empty for the bare page.
 */
function setRoute( href ) {
	const url = new URL( window.location.href );
	url.hash = '';
	if ( href ) {
		url.searchParams.set( 'p', href );
	} else {
		url.searchParams.delete( 'p' );
	}
	window.history.replaceState( null, '', url );
}

describe( 'App', () => {
	// jsdom doesn't implement scrollTo; ScrollToTop calls it on mount.
	beforeEach( () => {
		window.scrollTo = () => {};
		useMyJetpackConnection.mockReset();
		useMyJetpackConnection.mockReturnValue( {} );
	} );

	it.each( [
		[
			'records a deep link for a panel the page loaded open',
			true,
			'/features?configure=carousel',
			1,
		],
		[ 'records nothing with settings consolidation off', false, '/features?configure=carousel', 0 ],
		[ 'records nothing without a panel to open', true, '/features', 0 ],
	] )( '%s', ( _name, consolidation, route, opens ) => {
		const scriptData = window.JetpackScriptData;
		window.JetpackScriptData = {
			...scriptData,
			myJetpack: { settingsConsolidation: consolidation },
		};
		setRoute( route );
		mockRecordEvent.mockClear();

		try {
			const { rerender } = render( <App /> );
			rerender( <App /> );
		} finally {
			window.JetpackScriptData = scriptData;
		}

		const panelOpens = mockRecordEvent.mock.calls.filter(
			( [ event ] ) => event === 'jetpack_myjetpack_settings_panel_open'
		);
		expect( panelOpens ).toEqual(
			Array( opens ).fill( [
				'jetpack_myjetpack_settings_panel_open',
				{ feature_slug: 'carousel', trigger: 'deep-link', event_version: 1 },
			] )
		);
	} );

	it( 'renders the home screen at the default route', () => {
		setRoute( '' );

		render( <App /> );

		expect( screen.getByTestId( 'my-jetpack-screen' ) ).toBeInTheDocument();
	} );

	it( 'renders the home screen for an unknown route', () => {
		setRoute( '/not-a-real-route' );

		render( <App /> );

		expect( screen.getByTestId( 'my-jetpack-screen' ) ).toBeInTheDocument();
	} );

	it( 'gives the connection route its scoped scrolling layout', () => {
		setRoute( '/connection' );

		render( <App /> );

		const connect = screen.getByRole( 'button', { name: 'Connect your user account' } );
		// eslint-disable-next-line testing-library/no-node-access -- The scrolling layout belongs to the AdminPage root.
		expect( connect.closest( '.jp-admin-page' ) ).toHaveClass( 'jp-my-jetpack-connection' );
	} );

	it( 'renders the partner coupon screen in place of the routes', () => {
		setRoute( '' );
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

	describe( 'on a pricing route', () => {
		const purchaseData = {
			backup: { host_purchase_url: 'https://example.com/plans' },
			'anti-spam': { host_purchase_url: 'https://example.com/anti-spam' },
			protect: { host_purchase_url: 'https://example.com/scan' },
			stats: { purchase_url: 'https://example.org/stats-purchase', host_purchase_url: null },
		};
		const answers = {
			loaded: () => Promise.resolve( purchaseData ),
			failed: () => Promise.reject( { code: 'failed', message: 'Failed' } ),
			pending: () => new Promise( () => {} ),
		};

		const openRoute = ( route, hostMaySell, answer ) => {
			setRoute( route );
			queryClient.clear();
			replaceLocation.mockClear();
			apiFetch.mockImplementation( answers[ answer ] );
			window.myJetpackInitialState.products = {
				items: Object.fromEntries(
					Object.keys( purchaseData ).map( slug => [ slug, { slug, host_may_sell: hostMaySell } ] )
				),
			};
			render( <App /> );
		};

		afterEach( () => {
			queryClient.clear();
			apiFetch.mockReset();
			delete window.myJetpackInitialState.products;
		} );

		it.each( [
			[ '/add-backup', 'https://example.com/plans' ],
			[ '/add-akismet', 'https://example.com/anti-spam' ],
			[ '/add-anti-spam', 'https://example.com/anti-spam' ],
			[ '/add-scan', 'https://example.com/scan' ],
			[ '/add-protect/scan', 'https://example.com/scan' ],
		] )( 'leaves %s for the plans its host sells', async ( route, destination ) => {
			openRoute( route, true, 'loaded' );

			await waitFor( () => expect( replaceLocation.mock.calls ).toEqual( [ [ destination ] ] ) );
			expect( screen.queryByTestId( 'pricing-page' ) ).not.toBeInTheDocument();
		} );

		it.each( [
			[ 'once its host turns out not to sell the product', '/add-stats', true, 'loaded' ],
			[ "after the first failed attempt to load the host's answer", '/add-backup', true, 'failed' ],
			[ 'without waiting where no host sells', '/add-backup', false, 'pending' ],
		] )( 'shows the pricing page %s', async ( _name, route, hostMaySell, answer ) => {
			openRoute( route, hostMaySell, answer );

			await expect( screen.findByTestId( 'pricing-page' ) ).resolves.toBeInTheDocument();
			expect( replaceLocation ).not.toHaveBeenCalled();
		} );

		it( 'holds the pricing page until the host has answered', async () => {
			openRoute( '/add-backup', true, 'pending' );
			await waitFor( () => expect( apiFetch ).toHaveBeenCalled() );

			expect( screen.queryByTestId( 'pricing-page' ) ).not.toBeInTheDocument();
			expect( replaceLocation ).not.toHaveBeenCalled();
		} );
	} );

	it( 'hides the footer on offline Features', () => {
		const initial = window.myJetpackInitialState;
		const scriptData = window.JetpackScriptData;
		const local = { jetpack: 'inactive', features: [] };
		setRoute( '/features' );
		window.myJetpackInitialState = {
			...initial,
			isOfflineFeatures: true,
			products: { items: {} },
			myJetpackFlags: {},
		};
		window.JetpackScriptData = {
			site: { admin_url: 'http://example.org/wp-admin/' },
			myJetpack: { isAvailable: true, offlineFeatures: { mainFeatures: local, plugins: {} } },
		};
		apiFetch.mockResolvedValue( local );

		try {
			const view = render( <App /> );
			expect( screen.getByRole( 'heading', { name: 'Features' } ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'contentinfo', { name: 'Jetpack' } ) ).not.toBeInTheDocument();
			view.unmount();
		} finally {
			window.myJetpackInitialState = initial;
			window.JetpackScriptData = scriptData;
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
				setRoute( `${ entry }${ query }` );
				for ( let load = 0; load < 2; load++ ) {
					apiFetch.mockClear();
					// A reload starts with an empty cache.
					queryClient.clear();
					const view = render( <App /> );
					await waitFor( () => expect( getRouteHref() ).toBe( `/features${ query }` ) );
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
