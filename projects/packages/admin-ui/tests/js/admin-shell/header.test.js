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

	it( 'gives the app back after a few seconds, even if it never shows a heading', () => {
		jest.useFakeTimers();
		save( 'forms', '<div><h1>Forms</h1></div>' );
		const app = document.getElementById( 'app' );

		showHeader( 'forms', app );
		expect( app ).toHaveStyle( { visibility: 'hidden' } );
		jest.advanceTimersByTime( 3000 );

		expect( document.querySelector( '[data-shell-header]' ) ).toBeNull();
		expect( app ).not.toHaveStyle( { visibility: 'hidden' } );
		jest.useRealTimers();
	} );
} );
