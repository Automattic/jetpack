/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import CONNECTION_STORE_ID from '@automattic/jetpack-connection/state/store-id';
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { navigateTo } from './navigate';
import { stage as Stage } from './stage';
import type { ReactNode } from 'react';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
const setIsOfflineMode = ( isOfflineMode: boolean ) =>
	(
		dispatch( CONNECTION_STORE_ID ) as { setIsOfflineMode: ( value: boolean ) => void }
	 ).setIsOfflineMode( isOfflineMode );

const recordEvent = jest.mocked( analytics.tracks.recordEvent );

const AUTHORIZE_URL = 'https://jetpack.wordpress.com/jetpack.authorize/1/?client_id=4242';

jest.mock( './navigate', () => ( { navigateTo: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	Link: jest.requireActual( '../../tests/js/route-test-utils' ).mockWordPressRoute.Link,
	useSearch: () => ( {} ),
} ) );
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
	Page: ( { actions, children }: { actions: ReactNode; children: ReactNode } ) => (
		<main>
			{ actions }
			{ children }
		</main>
	),
} ) );

const navigate = jest.mocked( navigateTo );

let registration: () => Promise< unknown >;
let connectionStatus: () => Promise< unknown >;

const json = ( body: unknown ) => () =>
	Promise.resolve( { ok: true, status: 200, headers: new Headers(), json: async () => body } );

/**
 * Answers the connection REST API and the WordPress.com products list.
 *
 * @param url - The requested URL.
 * @return The response.
 */
function respond( url: string ) {
	if ( url.includes( 'jetpack/v4/connection/register' ) ) {
		return registration();
	}

	if ( /jetpack\/v4\/connection(\?|$)/.test( url ) ) {
		return connectionStatus();
	}

	return Promise.resolve( {
		ok: true,
		status: 200,
		json: async () => ( { jetpack_stats_yearly: { cost: 120, currency_code: 'USD' } } ),
	} );
}

const registered = ( authorizeUrl: string ) => json( { authorizeUrl } );

const requested = ( pattern: RegExp ) =>
	jest.mocked( globalThis.fetch ).mock.calls.some( ( [ url ] ) => pattern.test( String( url ) ) );

/**
 * Click a plan's button and let the navigation delay run out.
 *
 * @param name - The button's accessible name.
 */
async function choose( name: string ) {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

	await user.click( await screen.findByRole( 'button', { name } ) );
	await act( () => jest.runAllTimersAsync() );
}

describe( 'Connect stage', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		setIsOfflineMode( false );
		registration = registered( AUTHORIZE_URL );
		connectionStatus = json( { isRegistered: false } );
		recordEvent.mockClear();
		navigate.mockReset();
		globalThis.fetch = jest.fn( respond ) as unknown as typeof fetch;
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'sends a paid choice to the upgrade page once the site is registered', async () => {
		render( <Stage /> );

		await choose( 'Get Paid Stats' );

		expect( navigate ).toHaveBeenCalledTimes( 1 );
		expect( navigate ).toHaveBeenCalledWith( expect.stringContaining( 'p=%2Fupgrade' ) );
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_pre_connection_register_success',
			expect.objectContaining( { blog_id: 4242 } )
		);
	} );

	it.each( [ 'Start for free', 'I already have a plan' ] )(
		'sends "%s" to authorize after registering',
		async name => {
			render( <Stage /> );

			await choose( name );

			expect( navigate ).toHaveBeenCalledTimes( 1 );
			expect( navigate ).toHaveBeenCalledWith(
				expect.stringMatching( /^https:\/\/jetpack\.wordpress\.com\/jetpack\.authorize\// )
			);
		}
	);

	it.each( [
		[ 'Get Paid Stats', expect.stringContaining( 'p=%2Fupgrade' ) ],
		[ 'Start for free', 'admin.php?page=jetpack-premium-analytics-wp-admin' ],
	] )(
		'does not register "%s" again on a site connected since the page loaded',
		async ( name, destination ) => {
			connectionStatus = json( { isRegistered: true } );
			render( <Stage /> );

			await choose( name );

			expect( requested( /connection\/register/ ) ).toBe( false );
			expect( navigate ).toHaveBeenCalledWith( destination );
		}
	);

	it.each( [
		[
			'the request never reaches the site',
			() => {
				registration = () => Promise.reject( new Error( 'offline' ) );
			},
			/could not connect this site/,
			'FetchNetworkError',
		],
		[
			'the site rejects it',
			() => {
				registration = () =>
					Promise.resolve( {
						ok: false,
						status: 500,
						json: async () => ( {
							code: 'site_inaccessible',
							message: 'WordPress.com cannot reach this site.',
						} ),
					} );
			},
			/cannot reach this site/,
			'site_inaccessible',
		],
		[
			'the site returns no authorization URL',
			() => {
				registration = registered( '' );
			},
			/could not connect this site/,
			'missing_authorize_url',
		],
		[
			'the site cannot say whether it is connected',
			() => {
				connectionStatus = () => Promise.reject( new Error( 'offline' ) );
			},
			/could not connect this site/,
			'Error',
		],
	] )(
		'keeps a paid choice on the grid with the reason when %s',
		async ( _case, setUp, message, errorCode ) => {
			// No navigation delay to run out, and the API client's rejection settles on real promise ticks.
			jest.useRealTimers();
			setUp();
			render( <Stage /> );

			await userEvent.click( await screen.findByRole( 'button', { name: 'Get Paid Stats' } ) );

			await expect( screen.findByText( message ) ).resolves.toBeInTheDocument();
			expect( navigate ).not.toHaveBeenCalled();
			expect( screen.getByRole( 'button', { name: 'Get Paid Stats' } ) ).toBeEnabled();
			expect( recordEvent ).toHaveBeenCalledWith(
				'jetpack_premium_analytics_pre_connection_register_failed',
				expect.objectContaining( { error_code: errorCode } )
			);
		}
	);

	it( 'shows the paid choice as loading, and holds the others, while the site registers', async () => {
		registration = () => new Promise( () => {} );
		render( <Stage /> );

		await choose( 'Get Paid Stats' );

		const paid = screen.getByRole( 'button', { name: 'Get Paid Stats' } );
		// Jetpack's Button marks loading with a decorative spinner alone; it sets no aria-busy.
		expect( within( paid ).getByRole( 'presentation' ) ).toBeInTheDocument();
		expect( paid ).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Start for free' } ) ).toBeDisabled();
	} );

	it( 'shows the offline notice instead of the plans in offline mode', () => {
		setIsOfflineMode( true );
		render( <Stage /> );

		expect( screen.getByText( /offline mode/ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Start for free' } ) ).not.toBeInTheDocument();
	} );

	it( 'prices the paid plan per month from the yearly product', async () => {
		render( <Stage /> );

		await expect( screen.findByText( '10' ) ).resolves.toBeInTheDocument();
	} );

	it.each( [
		[ 'while the price loads', () => new Promise( () => {} ) ],
		[ 'when the price fails to load', () => Promise.reject( new Error( 'offline' ) ) ],
	] )(
		'shows no price, not even the free one, and keeps both price slots %s',
		async ( _case, products ) => {
			globalThis.fetch = jest.fn( products ) as unknown as typeof fetch;
			render( <Stage /> );

			await act( () => jest.runAllTimersAsync() );

			expect(
				screen.queryByText( '0', { ignore: '[aria-hidden="true"] *' } )
			).not.toBeInTheDocument();
			// Each empty slot reserves its height with a hidden price.
			expect( screen.getAllByText( '0' ) ).toHaveLength( 2 );
		}
	);
} );
