/**
 * Internal dependencies
 */
import WPLoginPage from '../lib/pages/wp-admin/login';
import Sidebar from '../lib/pages/wp-admin/sidebar';
import PluginsPage from '../lib/pages/wp-admin/plugins';
import DashboardPage from '../lib/pages/wp-admin/dashboard';
import JetpackPage from '../lib/pages/wp-admin/jetpack';
/**
 * External dependencies
 */
import { execSyncShellCommand, execShellCommand, execShellFile } from '../lib/utils-helper';
import { spawn } from 'child_process';
const fs = require( 'fs' );

jest.setTimeout( 600000 );

const execWithPromise = async command => {
	const out = fs.openSync( './out.log', 'a' );
	const err = fs.openSync( './out.log', 'a' );
	return new Promise( async ( resolve, reject ) => {
		const process = spawn( command, {
			detached: true,
			stdio: [ 'ignore', out, err ],
		} );
		// process.stdout.on( 'data', data => console.log( data ) );
		// process.stderr.on( 'data', data => console.log( 'ERR: ' + data ) );
		process.on( 'data', data => {
			console.log( data );
			return resolve( data );
		} );
		process.on( 'error', e => reject( e ) );
		process.on( 'close', e => reject( e ) );
		process.unref();
	} );
};

async function resetWordpressInstall() {
	const out = await execWithPromise( './tests/e2e/bin/setup-e2e-travis.sh', [ 'reset_wp' ] );
	// const out = await execShellFile( './tests/e2e/bin/setup-e2e-travis.sh', [ 'reset_wp' ] );
	// const out = await execShellCommand( './tests/e2e/bin/setup-e2e-travis.sh reset_wp' );
	console.log( '!!!!!!!!!!!!!!!!!' );
	// const file = fs.readFileSync( './out.log' );
	// console.log( file );
	// console.log( '======' );

	console.log( out );
}

function getNgrokSiteUrl() {
	const cmd =
		'echo $(curl -s localhost:4040/api/tunnels/command_line | jq --raw-output .public_url)';
	const out = execSyncShellCommand( cmd );

	console.log( out );
	return out;
}

describe( 'Jetpack connection', () => {
	beforeAll( async () => {
		getNgrokSiteUrl();
		await resetWordpressInstall();
		const url = getNgrokSiteUrl();
		await ( await WPLoginPage.visit( page, url + '/wp-login.php' ) ).login();
	} );

	it( 'Can find connect button on plugins page', async () => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();

		const pluginsPage = await PluginsPage.init( page );
		await pluginsPage.deactivateJetpack();
		await pluginsPage.activateJetpack();

		expect( await pluginsPage.isFullScreenPopupShown() ).toBeTruthy();
	} );

	it( 'Can find connect button on dashboard page', async () => {
		await ( await Sidebar.init( page ) ).selectDashboard();

		const dashboard = await DashboardPage.init( page );
		expect( await dashboard.isConnectBannerVisible() ).toBeTruthy();
	} );

	it( 'Can find connect button on Jetpack page', async () => {
		await ( await Sidebar.init( page ) ).selectJetpack();

		const jetpackPage = await JetpackPage.init( page );
		expect( await jetpackPage.isConnectBannerVisible() ).toBeTruthy();
	} );
} );
