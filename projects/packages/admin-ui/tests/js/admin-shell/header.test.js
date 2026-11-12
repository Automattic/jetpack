import { configureHeaders, rememberHeader, showHeader } from '../../../src/admin-shell/header';

const PREFIX = 'jetpack-admin-shell-header:1:7:0.15.0:';

beforeEach( () => {
	localStorage.clear();
	document.body.innerHTML = '<section id="app"></section>';
	configureHeaders( PREFIX, MEMBERS );
} );

const MEMBERS = {
	forms: { bodyClass: 'jetpack_page_forms' },
	newsletter: { bodyClass: 'jetpack_page_newsletter' },
};

const save = ( slug, html, css = '' ) =>
	localStorage.setItem( PREFIX + slug, JSON.stringify( { html, css } ) );

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

	it( 'saves the header and tab bar but none of the page content', () => {
		jest.useFakeTimers();
		const app = document.getElementById( 'app' );
		app.innerHTML =
			'<div class="admin-ui-navigable-region"><header><h1>Forms</h1></header><div><div role="tablist">Inbox</div></div><main>Responses</main></div>';

		rememberHeader( 'forms', app );
		jest.runAllTimers();
		app.innerHTML = '';
		showHeader( 'forms', app );

		const standIn = document.querySelector( '[data-shell-header="forms"]' );
		expect( standIn ).toHaveTextContent( 'Forms' );
		expect( standIn.querySelector( '[role="tablist"]' ) ).toHaveTextContent( 'Inbox' );
		expect( standIn ).not.toHaveTextContent( 'Responses' );
		jest.useRealTimers();
	} );

	it( 'borrows a saved standard header with the Jetpack logo, giving it this page’s title and none of its tabs or actions', () => {
		save( 'a-custom', '<div><h1>Custom</h1></div>' );
		save(
			'b-icon',
			'<div><header><span>Icon</span><h1 class="x__header-title">Icon</h1></header></div>'
		);
		save(
			'forms',
			'<div class="admin-ui-navigable-region"><header><div class="x__header-visual"><svg class="jetpack-logo"><path d="M1"></path></svg></div><h1 class="x__header-title">Forms</h1><div class="x__header-actions">New</div></header><div role="tablist">Tabs</div></div>'
		);

		showHeader( 'newsletter', document.getElementById( 'app' ), 'Newsletter' );

		const standIn = document.querySelector( '[data-shell-header="newsletter"]' );
		expect( standIn.querySelector( 'h1' ) ).toHaveTextContent( 'Newsletter' );
		expect( standIn.querySelector( 'svg.jetpack-logo path' ) ).toHaveAttribute( 'd', 'M1' );
		expect( standIn ).not.toHaveTextContent( /New\b|Tabs/ );
	} );

	it( 'moves a saved header’s page-scoped styles to the page it is shown for', () => {
		jest.useFakeTimers();
		document.head.innerHTML =
			'<style>body.jetpack_page_forms .x__header-title{margin:0}body.jetpack_page_forms-x .x__header-title{margin:1px}</style>';
		const app = document.getElementById( 'app' );
		app.innerHTML =
			'<div class="admin-ui-navigable-region"><header><h1 class="x__header-title">Forms</h1></header></div>';

		rememberHeader( 'forms', app );
		jest.runAllTimers();
		showHeader( 'newsletter', app, 'Newsletter' );

		const css = document.querySelector( '[data-shell-header="newsletter"] style' ).textContent;
		expect( css ).toContain( 'body.jetpack_page_newsletter .x__header-title' );
		expect( css ).toContain( 'body.jetpack_page_forms-x .x__header-title' );
		document.head.innerHTML = '';
		jest.useRealTimers();
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
