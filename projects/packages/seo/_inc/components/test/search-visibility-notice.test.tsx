import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import type { MouseEvent } from 'react';

let settings: Record< string, unknown > | null;
let preload: Record< string, unknown > | undefined;
let seoToolsActive: boolean;
jest.unstable_mockModule( '../../data/is-seo-tools-active', () => ( {
	default: () => seoToolsActive,
} ) );
jest.unstable_mockModule( '@wordpress/route', () => ( {
	useLinkProps: ( {
		to,
		search,
		onClick,
	}: {
		to: string;
		search: { focus: string };
		onClick: ( event: MouseEvent< HTMLAnchorElement > ) => void;
	} ) => ( {
		href: `/dashboard${ to }?focus=${ search.focus }`,
		onClick: ( event: MouseEvent< HTMLAnchorElement > ) => {
			onClick( event );
			event.preventDefault();
		},
	} ),
} ) );
jest.unstable_mockModule( '../../dashboard/dashboard-nav', () => ( {
	ROUTE_BY_TAB: { settings: '/settings' },
} ) );
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
	seoToolsActive = true;
} );

it.each( [
	[
		{},
		'Search engines are discouraged from indexing this site.',
		'/dashboard/settings?focus=visibility',
	],
	[
		{ site_is_private: true },
		'This site is not public, so search engines cannot access its content.',
		'/hosting/privacy',
	],
	[
		{ site_is_private: true, site_is_coming_soon: true },
		'This site is in Coming Soon mode, so search engines cannot access its content yet.',
		'/hosting/privacy',
	],
] )( 'explains restricted visibility for %j', ( state, message, href ) => {
	settings = { search_engines_visible: false, site_visibility_url: '/hosting/privacy', ...state };
	render( <SearchVisibilityNotice /> );
	expect( screen.getByText( message ) ).toBeInTheDocument();
	expect( screen.getByRole( 'link', { name: 'Review site visibility settings' } ) ).toHaveAttribute(
		'href',
		href
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
		'/dashboard/settings?focus=visibility'
	);
} );

it( 'keeps the external destination while SEO tools are off and the dashboard control is unavailable', () => {
	seoToolsActive = false;
	settings = { search_engines_visible: false, site_visibility_url: '/hosting/privacy' };
	render( <SearchVisibilityNotice /> );
	expect( screen.getByRole( 'link', { name: 'Review site visibility settings' } ) ).toHaveAttribute(
		'href',
		'/hosting/privacy'
	);
} );

it.each( [ false, true ] )(
	'uses the Reading fallback for a restricted site (Coming Soon: %s)',
	comingSoon => {
		preload = {
			search_engines_visible: false,
			site_is_private: true,
			site_is_coming_soon: comingSoon,
		};
		render( <SearchVisibilityNotice /> );
		expect(
			screen.getByRole( 'link', { name: 'Review site visibility settings' } )
		).toHaveAttribute( 'href', '/wp-admin/options-reading.php' );
	}
);

it( 'scrolls back to visibility on repeated clicks while already on Settings', () => {
	settings = { search_engines_visible: false };
	const scrollIntoView = jest.fn();
	render(
		<>
			<SearchVisibilityNotice />
			<section id="visibility" aria-label="Site visibility" />
		</>
	);
	const visibility = screen.getByRole( 'region', { name: 'Site visibility' } );
	visibility.scrollIntoView = scrollIntoView;
	const link = screen.getByRole( 'link', { name: 'Review site visibility settings' } );
	for ( let click = 0; click < 2; click++ ) {
		// eslint-disable-next-line testing-library/prefer-user-event -- Match the package's existing event tests.
		fireEvent.click( link );
	}
	expect( scrollIntoView ).toHaveBeenCalledTimes( 2 );
	expect( scrollIntoView ).toHaveBeenCalledWith( { block: 'start' } );
} );

it.each( [
	{ ctrlKey: true },
	{ metaKey: true },
	{ shiftKey: true },
	{ altKey: true },
	{ button: 1 },
] )( 'does not scroll the current tab for a modified click: %j', modifiers => {
	settings = { search_engines_visible: false };
	const scrollIntoView = jest.fn();
	render(
		<>
			<SearchVisibilityNotice />
			<section id="visibility" aria-label="Site visibility" />
		</>
	);
	screen.getByRole( 'region', { name: 'Site visibility' } ).scrollIntoView = scrollIntoView;
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package's existing event tests.
	fireEvent.click(
		screen.getByRole( 'link', { name: 'Review site visibility settings' } ),
		modifiers
	);
	expect( scrollIntoView ).not.toHaveBeenCalled();
} );

it.each( [ undefined, { search_engines_visible: true } ] )(
	'does not warn for unknown or public visibility: %j',
	state => {
		preload = state;
		const { container } = render( <SearchVisibilityNotice /> );
		expect( container ).toBeEmptyDOMElement();
	}
);
