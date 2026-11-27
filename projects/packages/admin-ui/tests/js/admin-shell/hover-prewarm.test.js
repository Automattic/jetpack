// jsdom can't import a blob URL, so the guest's copy of boot is stubbed.
jest.mock( '../../../src/admin-shell/adapter', () => ( {
	...jest.requireActual( '../../../src/admin-shell/adapter' ),
	prefetchBoot: () => Promise.resolve( '' ),
	bootFor: () => Promise.resolve( {} ),
} ) );

global.fetch ??= () => Promise.reject( new Error( 'Not mocked' ) );

const FORMS = 'jetpack-forms-responses-wp-admin';
const flush = () => new Promise( resolve => setTimeout( resolve, 0 ) );
const member = slug => ( { mountId: `${ slug }-root`, initModules: [], routes: [] } );

const config = {
	host: 'my-jetpack',
	members: { 'my-jetpack': member( 'my-jetpack' ), [ FORMS ]: member( FORMS ) },
	guestAssetsUrl: '/wp-admin/admin-ajax.php?action=jetpack_admin_shell_guest',
	headerStorageKey: 'jetpack-admin-shell-header:1:1:test:',
	printed: { scriptData: { site: '0123456789ab' }, inline: [] },
};

const guestRequests = () =>
	global.fetch.mock.calls
		.map( ( [ url ] ) => new URL( url ) )
		.filter( url => url.searchParams.get( 'action' ) === 'jetpack_admin_shell_guest' );

describe( 'admin shell client', () => {
	it( "preloads a member's page once when its menu link is hovered", async () => {
		history.replaceState( null, '', '/wp-admin/admin.php?page=my-jetpack' );
		document.body.innerHTML = `
			<ul id="adminmenu">
				<li><a href="admin.php?page=my-jetpack">My Jetpack</a></li>
				<li><a href="admin.php?page=${ FORMS }"><span>Forms</span></a></li>
			</ul>
			<div id="wpbody-content"><div id="my-jetpack-root"><h1>My Jetpack</h1></div></div>
			<script type="application/json" id="wp-script-module-data-@automattic/jetpack-admin-shell">${ JSON.stringify(
				config
			) }</script>
		`;
		jest.spyOn( global, 'fetch' ).mockResolvedValue( {
			ok: true,
			status: 200,
			json: () => Promise.resolve( { success: true, data: { html: '' } } ),
		} );
		require( '../../../src/admin-shell/index' );
		// Rest on the link past the shell's hover delay.
		const hover = async el => {
			el.dispatchEvent( new MouseEvent( 'pointerover', { bubbles: true } ) );
			await new Promise( resolve => setTimeout( resolve, 150 ) );
			await flush();
		};

		await hover( document.querySelector( 'a[href="admin.php?page=my-jetpack"]' ) );
		expect( guestRequests() ).toHaveLength( 0 );

		await hover( document.querySelector( `a[href$="${ FORMS }"] span` ) );
		await hover( document.querySelector( `a[href$="${ FORMS }"] span` ) );
		expect( guestRequests().map( url => url.searchParams.get( 'member' ) ) ).toEqual( [ FORMS ] );
		const [ , options ] = global.fetch.mock.lastCall;
		expect( JSON.parse( options.body.get( 'printed' ) ) ).toEqual( config.printed );
	} );
} );
