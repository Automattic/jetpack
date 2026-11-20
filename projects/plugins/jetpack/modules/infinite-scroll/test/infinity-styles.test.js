/**
 * Tests for how infinity.js loads the styles an Infinite Scroll response asks for.
 */

let sentRequests = [];

class FakeXHR {
	open() {}
	setRequestHeader() {}
	send( body ) {
		this.body = body;
		sentRequests.push( this );
	}
}

const respond = styles => {
	const scroller = window.infiniteScroll.scroller;
	scroller.ready = true;
	scroller.refresh();
	const xhr = sentRequests[ sentRequests.length - 1 ];
	xhr.status = 200;
	xhr.responseText = JSON.stringify( { type: 'success', html: '', styles } );
	xhr.onload();
};

beforeAll( () => {
	document.body.innerHTML = '<div id="content"></div>';
	window.XMLHttpRequest = FakeXHR;
	window.infiniteScroll = {
		settings: {
			id: 'content',
			ajaxurl: 'https://example.org/?infinity=scrolling',
			type: 'scroll',
			body_class: 'infinite-scroll',
			text: 'Older posts',
			totop: 'Scroll back to top',
			loading_text: 'Loading new page',
			footer: false,
			offset: 0,
			click_handle: false,
			scripts: [],
			styles: [ 'theme-style' ],
			query_args: {},
			wrapper: false,
		},
	};
	require( '../infinity' );
	window.infiniteScroll.scroller.check = () => true;
	jest.spyOn( window.infiniteScroll.scroller, 'render' ).mockImplementation();
} );

beforeEach( () => {
	sentRequests = [];
	document.head.innerHTML = '';
} );

describe( 'Infinite Scroll response styles', () => {
	test( 'inserts printed tags and records each handle once', () => {
		const block = { handle: 'core-block-supports', html: '<style>.layout-a{gap:1em}</style>' };

		respond( [ block ] );
		respond( [ { ...block, html: '<style>.layout-b{gap:2em}</style>' } ] );

		expect( document.head.querySelectorAll( 'style' ) ).toHaveLength( 2 );
		expect(
			window.infiniteScroll.settings.styles.filter( handle => handle === 'core-block-supports' )
		).toHaveLength( 1 );
	} );

	test( 'applies stylesheets deferred to window load, and leaves async ones to their onload', () => {
		respond( [
			{
				handle: 'is-deferred',
				html: '<link rel="stylesheet" id="is-deferred-css" href="https://example.org/d.css" media="not all" data-media="screen">',
			},
			{
				handle: 'is-async',
				html: '<link rel="stylesheet" id="is-async-css" href="https://example.org/a.css" media="not all" data-media="print" onload="this.media=this.dataset.media">',
			},
		] );

		expect( document.getElementById( 'is-deferred-css' ).media ).toBe( 'screen' );
		expect( document.getElementById( 'is-async-css' ).media ).toBe( 'not all' );
		expect( document.getElementById( 'is-async-css' ).dataset.media ).toBe( 'print' );
	} );

	test( 'inserts styles before the Additional CSS, as core does', () => {
		document.head.innerHTML = '<style id="wp-custom-css">.wp-block-quote{color:red}</style>';

		respond( [
			{ handle: 'is-ordered', html: '<style id="is-ordered">.wp-block-quote{color:blue}</style>' },
			{ handle: 'is-ordered-link', src: 'https://example.org/o.css' },
		] );

		expect( [ ...document.head.children ].map( node => node.id ) ).toEqual( [
			'is-ordered',
			'is-ordered-link-css',
			'wp-custom-css',
		] );
	} );

	test( 'inserts more CSS for a handle on the page right after that handle, ahead of theme styles', () => {
		document.head.innerHTML =
			'<style id="global-styles-inline-css">.a{}</style><link rel="stylesheet" id="theme-css" href="https://example.org/t.css">';

		respond( [
			{
				handle: 'global-styles',
				html: '<style>:root :where(.wp-block-quote){border-width:6px}</style>',
			},
		] );

		expect(
			[ ...document.head.children ].map( node => node.id || node.textContent.slice( 0, 7 ) )
		).toEqual( [ 'global-styles-inline-css', ':root :', 'theme-css' ] );
	} );

	test( 'loads entries that only have a src, and skips IE-only and handle-less entries', () => {
		respond( [
			{ handle: 'is-filtered', src: 'https://example.org/f.css', media: 'print' },
			{ handle: 'is-ie-only', src: 'https://example.org/ie.css', conditional: 'lt IE 9' },
			{ src: 'https://example.org/no-handle.css' },
		] );

		const links = document.head.querySelectorAll( 'link' );
		expect( links ).toHaveLength( 1 );
		expect( links[ 0 ].id ).toBe( 'is-filtered-css' );
		expect( links[ 0 ].href ).toBe( 'https://example.org/f.css' );
		expect( links[ 0 ].media ).toBe( 'print' );
		expect( window.infiniteScroll.settings.styles ).toContain( 'is-filtered' );
		expect( window.infiniteScroll.settings.styles ).not.toContain( 'is-ie-only' );
	} );
} );
