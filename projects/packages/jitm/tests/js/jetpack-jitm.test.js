const mockPending = [];

jest.mock( '@wordpress/dom-ready', () => callback => callback(), { virtual: true } );
jest.mock( '@wordpress/url', () => ( { addQueryArgs: ( path, args ) => ( { path, args } ) } ), {
	virtual: true,
} );
jest.mock(
	'@wordpress/api-fetch',
	() =>
		( { path } ) =>
			new Promise( resolve =>
				mockPending.push( {
					args: path.args,
					respond: () =>
						resolve( [
							{
								id: path.args.message_path,
								content: { message: path.args.message_path, classes: '', icon: '', list: [] },
								CTA: { message: 'Go' },
								url: '',
								activate_module: null,
							},
						] ),
				} )
			),
	{ virtual: true }
);

const settle = () => new Promise( resolve => setTimeout( resolve, 0 ) );
const cardIn = page =>
	document.querySelector( `[data-shell-page="${ page }"] .jitm-card .jitm-banner__title` )
		?.textContent;
const show = ( page, previous, query = '' ) => {
	window.history.replaceState( null, '', `/wp-admin/admin.php?page=${ page }${ query }` );
	window.dispatchEvent(
		new CustomEvent( 'jetpack-admin-shell:page-shown', {
			detail: { page, previous, firstShow: true, url: location.href },
		} )
	);
};

beforeEach( () => {
	mockPending.length = 0;
	window.history.replaceState( null, '', '/wp-admin/admin.php?page=host' );
	document.body.innerHTML = `
		<div class="jetpack-jitm-message" data-message-path="wp:jetpack_page_host:admin_notices" data-query="" data-redirect=""></div>
		<div data-shell-page="host"><div id="jp-admin-notices"></div></div>
		<section data-shell-page="guest"><div id="jp-admin-notices"></div></section>`;
	jest.isolateModules( () => require( '../../src/js/jetpack-jitm.js' ) );
} );

it( 'asks for the shown page’s JITMs on an admin shell switch and shows them in its app', async () => {
	mockPending.shift().respond();
	await settle();
	expect( cardIn( 'host' ) ).toBe( 'wp:jetpack_page_host:admin_notices' );

	show( 'guest', 'host', '&p=%2Fa%20b' );
	const guest = mockPending.shift();
	guest.respond();
	await settle();

	expect( guest.args ).toMatchObject( {
		query: encodeURIComponent( 'page=guest,p=%2Fa%20b' ),
	} );
	const redirect = encodeURIComponent( '/wp-admin/admin.php?page=guest&p=%2Fa%20b' );
	expect( document.querySelector( '.jitm-card a[title="Go"]' ) ).toHaveAttribute(
		'href',
		`&redirect=${ encodeURIComponent( redirect ) }`
	);
	expect( cardIn( 'host' ) ).toBeUndefined();
	expect( cardIn( 'guest' ) ).toBe( 'wp:jetpack_page_guest:admin_notices' );
} );

it( 'drops a response for a page the admin shell has switched away from', async () => {
	const host = mockPending.shift();
	show( 'guest', 'host' );
	host.respond();
	await settle();

	expect( document.querySelector( '.jitm-card' ) ).toBeNull();
} );

it( 'asks for nothing when the shown app has nowhere to show a JITM', async () => {
	mockPending.shift().respond();
	await settle();
	document.querySelector( '[data-shell-page="guest"] #jp-admin-notices' ).remove();

	show( 'guest', 'host' );
	await settle();

	expect( mockPending ).toHaveLength( 0 );
	expect( document.querySelector( '.jitm-card' ) ).toBeNull();
} );
