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
					messagePath: path.args.message_path,
					respond: () =>
						resolve( [
							{
								id: path.args.message_path,
								content: { message: path.args.message_path, classes: '', icon: '', list: [] },
								CTA: {},
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
const show = ( page, previous ) => {
	window.history.replaceState( null, '', `/wp-admin/admin.php?page=${ page }` );
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

	show( 'guest', 'host' );
	mockPending.shift().respond();
	await settle();

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
