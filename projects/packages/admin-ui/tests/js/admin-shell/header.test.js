import { configureHeaders, showHeader } from '../../../src/admin-shell/header';

const PREFIX = 'jetpack-admin-shell-header:1:7:0.15.0:';

beforeEach( () => {
	localStorage.clear();
	document.body.innerHTML = '<section id="app"></section>';
	configureHeaders( PREFIX );
} );

const save = ( slug, html ) =>
	localStorage.setItem( PREFIX + slug, JSON.stringify( { html, css: '' } ) );

describe( 'header stand-in', () => {
	it( 'drops headers an earlier release saved for this site and user, and no one else’s', () => {
		localStorage.setItem( 'jetpack-admin-shell-header:1:7:0.14.0:forms', '{}' );
		localStorage.setItem( 'jetpack-admin-shell-header:1:8:0.14.0:forms', '{}' );
		localStorage.setItem( 'jetpack-admin-shell-header:forms', '{}' );

		configureHeaders( PREFIX );

		expect( Object.keys( localStorage ) ).toEqual( [
			'jetpack-admin-shell-header:1:8:0.14.0:forms',
		] );
	} );

	it( 'shows a copy that cannot run anything', () => {
		save(
			'forms',
			'<div><h1 id="title" onclick="alert(1)">Forms</h1><a href="javascript:alert(1)">x</a><iframe srcdoc="x"></iframe><script>alert(1)</script></div>'
		);

		showHeader( 'forms', document.getElementById( 'app' ) );

		const standIn = document.querySelector( '[data-shell-header="forms"]' );
		expect( standIn.querySelector( 'h1' ).outerHTML ).toBe( '<h1>Forms</h1>' );
		expect( standIn.querySelector( 'a' ) ).not.toHaveAttribute( 'href' );
		expect( standIn.querySelector( 'iframe, script' ) ).toBeNull();
	} );

	it( 'borrows another page’s header, with this page’s title, the Jetpack logo and none of its tabs or actions', () => {
		save(
			'forms',
			'<div class="admin-ui-navigable-region"><header><h1 class="x__header-title">Forms</h1><div class="x__header-actions">New</div></header><div role="tablist">Tabs</div></div>'
		);

		showHeader( 'newsletter', document.getElementById( 'app' ), 'Newsletter' );

		const standIn = document.querySelector( '[data-shell-header="newsletter"]' );
		expect( standIn.querySelector( 'h1' ) ).toHaveTextContent( 'Newsletter' );
		expect( standIn ).not.toHaveTextContent( /New\b|Tabs/ );
		expect( standIn.querySelector( 'svg.jetpack-logo' ) ).not.toBeNull();
	} );

	it( 'moves a borrowed header’s page-scoped styles to the page being opened', () => {
		localStorage.setItem(
			PREFIX + 'forms',
			JSON.stringify( {
				html: '<div class="admin-ui-navigable-region"><header><h1 class="x__header-title">Forms</h1></header></div>',
				css: 'body.jetpack_page_forms .jp-admin-page{margin:0}',
			} )
		);

		showHeader( 'newsletter', document.getElementById( 'app' ), 'Newsletter' );

		expect( document.querySelector( '[data-shell-header="newsletter"] style' ) ).toHaveTextContent(
			'body.jetpack_page_newsletter .jp-admin-page{margin:0}'
		);
	} );

	it( 'gives the app back after a few seconds, even if it never shows a heading', () => {
		jest.useFakeTimers();
		save( 'forms', '<div><h1>Forms</h1></div>' );
		const app = document.getElementById( 'app' );

		showHeader( 'forms', app );
		expect( app ).toHaveStyle( { visibility: 'hidden' } );
		jest.advanceTimersByTime( 8000 );

		expect( document.querySelector( '[data-shell-header]' ) ).toBeNull();
		expect( app ).not.toHaveStyle( { visibility: 'hidden' } );
		jest.useRealTimers();
	} );
} );
