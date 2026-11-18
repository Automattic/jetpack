import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const isSeoToolsActive = jest.fn( () => true );
jest.unstable_mockModule( '../../data/is-seo-tools-active', () => ( {
	default: isSeoToolsActive,
} ) );

const { default: SeoPausedBanner } = await import( '../seo-paused-banner' );

const setPaused = ( plugin: string ) => {
	( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/' },
		seo: { output: { paused: true, conflicting_plugin: plugin } },
	};
};

describe( 'SeoPausedBanner', () => {
	afterEach( () => {
		delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
		isSeoToolsActive.mockReturnValue( true );
	} );

	it.each( [
		[
			'Yoast SEO',
			'Yoast SEO is managing your site’s SEO, so Jetpack has paused its SEO titles, descriptions, canonical URLs, structured data and llms.txt. Your saved settings are kept. Deactivate Yoast SEO to use them.',
		],
		[
			'',
			'Jetpack’s SEO titles, descriptions, structured data and llms.txt are turned off on this site. Your saved settings are kept.',
		],
	] )( 'shows the banner with "%s" in charge', ( plugin, banner ) => {
		setPaused( plugin );

		render( <SeoPausedBanner /> );

		expect( screen.getByText( banner ) ).toBeInTheDocument();
	} );

	it( 'links to the Plugins screen only when a plugin is named', () => {
		setPaused( 'Yoast SEO' );
		const { unmount } = render( <SeoPausedBanner /> );

		expect( screen.getByRole( 'link', { name: 'Manage plugins' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/plugins.php'
		);

		unmount();
		setPaused( '' );
		render( <SeoPausedBanner /> );

		expect( screen.queryByRole( 'link', { name: 'Manage plugins' } ) ).not.toBeInTheDocument();
	} );

	it( 'stays hidden while SEO tools are off', () => {
		setPaused( 'Yoast SEO' );
		isSeoToolsActive.mockReturnValue( false );

		render( <SeoPausedBanner /> );

		expect( screen.queryByText( /SEO titles, descriptions/ ) ).not.toBeInTheDocument();
	} );

	it( 'stays hidden while Jetpack owns the output', () => {
		render( <SeoPausedBanner /> );

		expect( screen.queryByText( /SEO titles, descriptions/ ) ).not.toBeInTheDocument();
	} );
} );
