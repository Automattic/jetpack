import { configureHeaders, rememberHeader, showHeader } from '../../../src/admin-shell/header';

const PREFIX = 'jetpack-admin-shell-header:1:7:0.15.0:abc:';

beforeEach( () => {
	document.head.innerHTML = '';
	localStorage.clear();
	sessionStorage.clear();
	document.body.innerHTML = '<section id="app"></section>';
	configureHeaders( PREFIX, MEMBERS );
} );

const MEMBERS = {
	forms: { bodyClass: 'jetpack_page_forms' },
	newsletter: { bodyClass: 'jetpack_page_newsletter' },
};

const stored = () => JSON.parse( sessionStorage.getItem( PREFIX ) ) ?? { pieces: {}, pages: {} };

const save = ( slug, html, css = '' ) => {
	const { pieces, pages } = stored();
	pieces[ slug ] = css;
	pages[ slug ] = { html, css: [ slug ], styles: [] };
	sessionStorage.setItem( PREFIX, JSON.stringify( { pieces, pages } ) );
};

describe( 'header stand-in', () => {
	it( 'drops headers saved for another site, release or login, and those earlier releases kept for good', () => {
		sessionStorage.setItem( PREFIX, '{}' );
		sessionStorage.setItem( PREFIX + 'forms', '{}' );
		sessionStorage.setItem( 'jetpack-admin-shell-header:1:7:0.15.0:old:', '{}' );
		sessionStorage.setItem( 'jetpack-admin-shell-header:2:7:0.15.0:abc:', '{}' );
		localStorage.setItem( 'jetpack-admin-shell-header:1:7:0.14.0:forms', '{}' );
		localStorage.setItem( 'jetpack-admin-shell-loader-offset', '40' );

		configureHeaders( PREFIX );

		expect( Object.keys( sessionStorage ) ).toEqual( [ PREFIX ] );
		expect( Object.keys( localStorage ) ).toEqual( [ 'jetpack-admin-shell-loader-offset' ] );
	} );

	it( 'drops the headers of pages the shell no longer has, and the pieces only they used', () => {
		save( 'forms', '<div><h1>Forms</h1></div>', '.a{}' );
		save( 'blaze', '<div><h1>Blaze</h1></div>', '.b{}' );

		configureHeaders( PREFIX, MEMBERS );

		expect( stored() ).toEqual( {
			pieces: { forms: '.a{}' },
			pages: { forms: { html: '<div><h1>Forms</h1></div>', css: [ 'forms' ], styles: [] } },
		} );
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

	const withSubtitle = ( title, subtitle ) =>
		`<div><header><div class="x__header-visual"><svg class="jetpack-logo"></svg></div><h1 class="x__header-title">${ title }</h1><p class="x__header-subtitle">${ subtitle }</p></header></div>`;

	const extended = 'Short. <button>More?</button>';

	it.each( [
		[ 'a borrowed header', 'z-donor', 'Old subtitle', 'Shiny new subtitle', 'Shiny new subtitle' ],
		[
			'its own outdated header',
			'newsletter',
			'Old subtitle',
			'Shiny new subtitle',
			'Shiny new subtitle',
		],
		[ 'a borrowed header, for a page without a subtitle', 'z-donor', 'Old subtitle', '', null ],
		[
			'its own header that extends the declared subtitle',
			'newsletter',
			extended,
			'Short.',
			'Short. More?',
		],
		[
			'a borrowed header that extends the declared subtitle',
			'z-donor',
			extended,
			'Short.',
			'Short.',
		],
		[ 'its own header, for a subtitle picked as it renders', 'newsletter', 'Old', null, 'Old' ],
		[ 'a borrowed header, for a subtitle picked as it renders', 'z-donor', 'Old', null, '\u00a0' ],
	] )(
		'gives %s the declared title and subtitle',
		( _, savedAs, savedSubtitle, subtitle, shown ) => {
			// Sorts first, but has no subtitle row to fill.
			save(
				'a-logo',
				'<div><header><svg class="jetpack-logo"></svg><h1 class="x__header-title">A</h1></header></div>'
			);
			save( savedAs, withSubtitle( 'Old title', savedSubtitle ) );

			showHeader( 'newsletter', document.getElementById( 'app' ), 'Newsletter', {
				title: 'Newsletter',
				subtitle,
			} );

			const standIn = document.querySelector( '[data-shell-header="newsletter"]' );
			expect( standIn.querySelector( 'h1' ) ).toHaveTextContent( 'Newsletter' );
			expect( standIn.querySelector( '.x__header-subtitle' )?.textContent ?? null ).toBe( shown );
		}
	);

	it( 'prefers a donor whose saved markup, not just its CSS, has a subtitle row', () => {
		save(
			'a-logo',
			'<div><header><svg class="jetpack-logo"></svg><h1 class="x__header-title">A</h1></header></div>',
			'.x__header.y__has-navigation .x__header-subtitle{margin:0}'
		);
		save( 'z-donor', withSubtitle( 'Old title', 'Old subtitle' ) );

		showHeader( 'newsletter', document.getElementById( 'app' ), 'Newsletter', {
			title: 'Newsletter',
			subtitle: 'Shiny new subtitle',
		} );

		expect(
			document.querySelector( '[data-shell-header="newsletter"] .x__header-subtitle' )
		).toHaveTextContent( 'Shiny new subtitle' );
	} );

	it.each( [
		[ 'its subtitle', 'View a summary of your newsletter.', 'View a summary of your newsletter.' ],
		[ 'a blank line for a subtitle picked as it renders', null, '&nbsp;' ],
	] )(
		'adds a subtitle row styled as the page header’s, with %s, when no saved header has one',
		( _, subtitle, shown ) => {
			document.head.innerHTML =
				'<style>.b__header-subtitle{color:gray}@media screen{.t__body-md{font-size:13px}}</style>';
			save(
				'my-jetpack',
				'<div><header><div class="b__header-content"><h1 class="t__text t__heading-lg b__header-title">Jetpack</h1></div></header></div>'
			);

			showHeader( 'newsletter', document.getElementById( 'app' ), 'Newsletter', {
				title: 'Newsletter',
				subtitle,
			} );

			const row = document.querySelector(
				'[data-shell-header="newsletter"] .b__header-content + p'
			);
			expect( row.innerHTML ).toBe( shown );
			expect( [ ...row.classList ] ).toEqual( [ 't__text', 'b__header-subtitle', 't__body-md' ] );
		}
	);

	it( 'does not save a header its page hides', () => {
		jest.useFakeTimers();
		const app = document.getElementById( 'app' );
		app.innerHTML =
			'<div class="admin-ui-navigable-region"><header><h1>Boost</h1></header><main>Pricing</main></div>';
		app.querySelector( 'h1' ).checkVisibility = () => false;

		rememberHeader( 'boost', app );
		jest.runAllTimers();

		expect( sessionStorage.getItem( PREFIX ) ).toBeNull();
		jest.useRealTimers();
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

	it( 'keeps one copy of what pages share, and drops it once no page uses it', () => {
		jest.useFakeTimers();
		document.head.innerHTML = '<style>.x__title{color:red}</style>';
		const app = document.getElementById( 'app' );
		const header = ( title, style ) =>
			`<div style="${ style }"><div class="admin-ui-navigable-region"><header><h1 class="x__title">${ title }</h1></header></div></div>`;
		const pieces = () => Object.values( stored().pieces );

		for ( const slug of [ 'forms', 'newsletter' ] ) {
			app.innerHTML = header( slug, '--x-color: blue;' );
			rememberHeader( slug, app );
			jest.runAllTimers();
		}
		expect( pieces() ).toHaveLength( 2 );

		app.innerHTML = header( 'newsletter', '--x-color: green;' );
		rememberHeader( 'newsletter', app );
		jest.runAllTimers();
		app.innerHTML = header( 'forms', '--x-color: green;' );
		rememberHeader( 'forms', app );
		jest.runAllTimers();
		app.innerHTML = '';
		showHeader( 'forms', app );

		expect( pieces() ).toHaveLength( 2 );
		expect( pieces().join() ).not.toContain( 'blue' );
		expect( document.querySelector( '[data-shell-header="forms"] div' ) ).toHaveStyle( {
			'--x-color': 'green',
		} );
		jest.useRealTimers();
	} );

	it( 'keeps an anonymous layer’s rules in one layer', () => {
		jest.useFakeTimers();
		document.head.innerHTML =
			'<style>@layer { .x__title.big{color:red} .x__title{color:blue} }</style>';
		const app = document.getElementById( 'app' );
		app.innerHTML =
			'<div class="admin-ui-navigable-region"><header><h1 class="x__title big">Forms</h1></header></div>';

		rememberHeader( 'forms', app );
		jest.runAllTimers();
		app.innerHTML = '';
		showHeader( 'forms', app );

		const css = document.querySelector( '[data-shell-header="forms"] style' ).textContent;
		expect( css.match( /@layer/g ) ).toHaveLength( 1 );
		jest.useRealTimers();
	} );

	// The module as a new document loads it, with nothing remembered from earlier saves.
	const freshHeader = () => {
		let header;
		jest.isolateModules( () => {
			header = require( '../../../src/admin-shell/header' );
		} );
		header.configureHeaders( PREFIX, MEMBERS );
		return header;
	};

	it( 'does not save an unchanged header again in a new document', () => {
		jest.useFakeTimers();
		const app = document.getElementById( 'app' );
		const region = document.createElement( 'div' );
		region.className = 'admin-ui-navigable-region';
		region.style.color = 'red';
		// A div inside a p: the HTML parser would move it out, so the saved copy reads back different.
		region.innerHTML = '<header><h1>Forms</h1><p class="x__header-subtitle"></p></header>';
		region.querySelector( 'p' ).append( document.createElement( 'div' ) );
		app.append( region );
		freshHeader().rememberHeader( 'forms', app );
		jest.runAllTimers();
		const setItem = jest.spyOn( Storage.prototype, 'setItem' );

		freshHeader().rememberHeader( 'forms', app );
		jest.runAllTimers();

		expect( setItem ).not.toHaveBeenCalled();
		setItem.mockRestore();
		jest.useRealTimers();
	} );

	it( 'saves a header again when its saved pieces are missing', () => {
		jest.useFakeTimers();
		const html = style =>
			`<div class="admin-ui-navigable-region" style="${ style }"><header><h1>Forms</h1></header></div>`;
		sessionStorage.setItem(
			PREFIX,
			JSON.stringify( {
				pieces: {},
				pages: { forms: { html: html( '0' ), css: [], styles: [ '0' ] } },
			} )
		);
		const app = document.getElementById( 'app' );
		app.innerHTML = html( 'color: red;' );

		freshHeader().rememberHeader( 'forms', app );
		jest.runAllTimers();

		expect( Object.values( stored().pieces ) ).toEqual( [ 'color: red;' ] );
		jest.useRealTimers();
	} );

	it.each( [
		[ 'no pages', { pages: null } ],
		[ 'a page without CSS', { pages: { forms: { html: '<div><h1>Forms</h1></div>' } } } ],
		[ 'a donor without markup', { pages: { other: { css: [], styles: [] } } } ],
		[
			'a page naming pieces it lacks',
			{
				pieces: {},
				pages: {
					forms: { html: '<div style="9"><h1>Forms</h1></div>', css: [ '9' ], styles: [ '9' ] },
				},
			},
		],
	] )( 'shows what it can of a store with %s, without failing', ( _, store ) => {
		sessionStorage.setItem( PREFIX, JSON.stringify( store ) );

		expect( () => showHeader( 'forms', document.getElementById( 'app' ), 'Forms' ) ).not.toThrow();
		expect( document.body.innerHTML ).not.toContain( 'undefined' );
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
