/* eslint-disable testing-library/no-node-access */
// Test dependencies come from the plugin, not the wp-build route package.
// eslint-disable-next-line import/no-extraneous-dependencies
import { act, fireEvent, render, screen } from '@testing-library/react';
import { stage as Stage } from './stage';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( { tab: new URLSearchParams( globalThis.location.search ).get( 'tab' ) } ),
	useNavigate: () => mockNavigate,
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <main>{ children }</main>,
} ) );

const subpages = [
	'cache-debug-log',
	'critical-css-advanced',
	'getting-started',
	'purchase-successful',
];

const getSettingsMount = () => document.getElementById( 'jb-settings-tab-mount' );
const getSubpageMount = () => document.getElementById( 'jb-subpage-mount' );

beforeEach( () => {
	window.history.replaceState( null, '', '/?page=jetpack-boost' );
	Object.assign( window, { wpApiSettings: { root: '/wp-json/', nonce: 'test-nonce' } } );
	mockNavigate.mockReset();
} );

describe( 'Boost dashboard stage', () => {
	it.each( [
		[ '', 'Overview' ],
		[ '&tab=settings', 'Settings' ],
	] )( 'selects %s as the %s tab', ( query, tab ) => {
		window.history.replaceState( null, '', `/?page=jetpack-boost${ query }` );
		render( <Stage /> );

		expect( screen.getByRole( 'tab', { selected: true } ) ).toBe(
			screen.getByRole( 'tab', { name: tab } )
		);
		expect( getSubpageMount()?.hidden ).toBe( true );
		expect( getSettingsMount() ).not.toBeNull();
		expect( screen.getByRole( 'tabpanel' ).contains( getSettingsMount() ) ).toBe(
			tab === 'Settings'
		);
	} );

	it.each(
		subpages.flatMap( hash => [
			[ hash, '' ],
			[ hash, '&tab=settings' ],
		] )
	)( 'shows #%s in the full-page slot with query %s', ( hash, query ) => {
		window.history.replaceState( null, '', `/?page=jetpack-boost${ query }#/${ hash }` );
		render( <Stage /> );

		expect( getSubpageMount()?.hidden ).toBe( false );
		expect( getSubpageMount()?.closest( '[role="tabpanel"]' ) ).toBeNull();
		expect( screen.queryAllByRole( 'tablist' ) ).toHaveLength( 0 );
		expect( getSettingsMount() ).not.toBeNull();
	} );

	it.each( [ 'cache-debug-log', 'critical-css-advanced' ] )(
		'returns to Settings when leaving #%s',
		hash => {
			window.history.replaceState( null, '', `/?page=jetpack-boost#/${ hash }` );
			render( <Stage /> );

			act( () => {
				window.history.replaceState( null, '', '/?page=jetpack-boost#/' );
				window.dispatchEvent( new HashChangeEvent( 'hashchange' ) );
			} );

			expect( mockNavigate ).toHaveBeenCalledWith( { search: { tab: 'settings' }, replace: true } );
			expect( getSubpageMount()?.hidden ).toBe( true );
		}
	);

	it( 'keeps both mount nodes across tab changes and subpage visits', () => {
		const { rerender } = render( <Stage /> );
		const settingsMount = getSettingsMount();
		const subpageMount = getSubpageMount();

		for ( const url of [
			'/?page=jetpack-boost&tab=settings',
			'/?page=jetpack-boost&tab=settings#/critical-css-advanced',
			'/?page=jetpack-boost&tab=settings#/',
			'/?page=jetpack-boost',
		] ) {
			act( () => {
				window.history.replaceState( null, '', url );
				window.dispatchEvent( new HashChangeEvent( 'hashchange' ) );
			} );
			rerender( <Stage /> );

			expect( getSettingsMount() ).toBe( settingsMount );
			expect( getSubpageMount() ).toBe( subpageMount );
		}
	} );

	it( 'uses the route query when selecting a tab', () => {
		render( <Stage /> );

		// This suite uses fireEvent because Boost does not depend on user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );

		expect( mockNavigate ).toHaveBeenCalledWith( { search: { tab: 'settings' }, replace: false } );
	} );
} );
