import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

let settings: Record< string, unknown > | null;
let preload: Record< string, unknown > | undefined;
jest.unstable_mockModule( '../../data/settings-store', () => ( {
	settingsStore: 'test/settings',
} ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect: ( callback: ( select: () => { getSettings: () => typeof settings } ) => unknown ) =>
		callback( () => ( { getSettings: () => settings } ) ),
} ) );
jest.unstable_mockModule( '../../data/get-preloaded', () => ( {
	SETTINGS_PATH: '/settings',
	OVERVIEW_PATH: '/overview',
	getPreloaded: ( path: string ) =>
		path === '/overview' && preload ? { site_visibility: preload } : undefined,
} ) );
jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `/wp-admin/${ path }`,
} ) );
const { default: SearchVisibilityNotice } = await import( '../search-visibility-notice' );

beforeEach( () => {
	settings = null;
	preload = undefined;
} );

it.each( [
	[ {}, 'Search engines are discouraged from indexing this site.' ],
	[
		{ site_is_private: true },
		'This site is not public, so search engines cannot access its content.',
	],
	[
		{ site_is_private: true, site_is_coming_soon: true },
		'This site is in Coming Soon mode, so search engines cannot access its content yet.',
	],
] )( 'explains restricted visibility for %j', ( state, message ) => {
	settings = { search_engines_visible: false, site_visibility_url: '/hosting/privacy', ...state };
	render( <SearchVisibilityNotice /> );
	expect( screen.getByText( message ) ).toBeInTheDocument();
	expect( screen.getByRole( 'link', { name: 'Review site visibility settings' } ) ).toHaveAttribute(
		'href',
		'/hosting/privacy'
	);
} );

it( 'updates immediately after a saved visibility change', () => {
	settings = { search_engines_visible: false };
	const { rerender } = render( <SearchVisibilityNotice /> );
	expect( screen.getByText( /discouraged from indexing/ ) ).toBeInTheDocument();
	settings = { search_engines_visible: true };
	rerender( <SearchVisibilityNotice /> );
	expect( screen.queryByText( /discouraged from indexing/ ) ).not.toBeInTheDocument();
} );

it( 'uses Overview visibility when Settings has not loaded', () => {
	preload = { search_engines_visible: false };
	render( <SearchVisibilityNotice /> );
	expect( screen.getByRole( 'link', { name: 'Review site visibility settings' } ) ).toHaveAttribute(
		'href',
		'/wp-admin/options-reading.php'
	);
} );

it.each( [ undefined, { search_engines_visible: true } ] )(
	'does not warn for unknown or public visibility: %j',
	state => {
		preload = state;
		const { container } = render( <SearchVisibilityNotice /> );
		expect( container ).toBeEmptyDOMElement();
	}
);
