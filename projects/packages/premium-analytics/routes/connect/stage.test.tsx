/**
 * External dependencies
 */
import CONNECTION_STORE_ID from '@automattic/jetpack-connection/state/store-id';
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
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

	return Promise.resolve( {
		ok: true,
		status: 200,
		json: async () => ( { jetpack_stats_yearly: { cost: 120, currency_code: 'USD' } } ),
	} );
}

const registered = ( authorizeUrl: string ) => () =>
	Promise.resolve( { ok: true, status: 200, json: async () => ( { authorizeUrl } ) } );

/**
 * Click a plan's button and let the navigation delay run out.
 *
 * @param name - The button's accessible name.
 */
async function choose( name: string ) {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

	await user.click( await screen.findByRole( 'button', { name } ) );
	await act( async () => {
		jest.runAllTimers();
	} );
}

describe( 'Connect stage', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		setIsOfflineMode( false );
		registration = registered( AUTHORIZE_URL );
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
		[
			'registration fails',
			() => ( registration = () => Promise.reject( new Error( 'offline' ) ) ),
		],
	] )( 'keeps a paid choice on the grid with an error when %s', async ( _case, arrange ) => {
		arrange();
		render( <Stage /> );

		await choose( 'Get Paid Stats' );

		expect( navigate ).not.toHaveBeenCalled();
		expect( screen.getByText( /could not connect this site/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Get Paid Stats' } ) ).toBeEnabled();
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

	it( 'shows no price, not even the free one, until it knows the currency', async () => {
		globalThis.fetch = jest.fn( () => new Promise( () => {} ) ) as unknown as typeof fetch;
		render( <Stage /> );

		await expect(
			screen.findByRole( 'button', { name: 'Start for free' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( '0', { ignore: '[aria-hidden="true"] *' } )
		).not.toBeInTheDocument();
	} );
} );
