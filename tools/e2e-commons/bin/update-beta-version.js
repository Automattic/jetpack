import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

/* eslint-disable no-process-exit */

// Below call should be BEFORE requiring config, so library wil pick it up.
process.env.NODE_CONFIG_DIR = fileURLToPath( new URL( '../config', import.meta.url ) );
const { resolveSiteUrl, getSiteCredentials } = await import( '../helpers/utils-helper.js' );

/**
 * Get HTTP Authentication header value
 * @returns {string} header value
 */
function getAuthHeader() {
	const credentials = getSiteCredentials();
	return (
		'Basic ' +
		Buffer.from( credentials.username + ':' + credentials.apiPassword ).toString( 'base64' )
	);
}

/**
 * Get Jetpack version from site
 * @returns {string} Version
 */
async function getJetpackVersionFromSite() {
	let response;
	try {
		response = await fetch( resolveSiteUrl() + '/index.php?rest_route=/wp/v2/plugins', {
			headers: { Authorization: getAuthHeader() },
		} );

		const contentType = response.headers.get( 'content-type' );
		if ( contentType && ! contentType.startsWith( 'application/json' ) ) {
			const out = await response.text();
			if ( out.includes( 'Briefly unavailable for scheduled maintenance' ) ) {
				console.log( 'Site is down for maintenance' );
			}
			return {};
		}
		const plugins = await response.json();

		const jetpackDev = plugins.find( p => p.plugin === 'jetpack-dev/jetpack' );
		// console.log(jetpackDev);
		return jetpackDev.version;
	} catch ( error ) {
		console.error( `Failed to get Jetpack version from atomic site: ${ error }` );
		return '';
	}
}

/**
 * Force plugin updates
 */
async function forcePluginUpdates() {
	const response = await fetch(
		resolveSiteUrl() + '/index.php?rest_route=/jp-e2e/v1/beta-autoupdate',
		{
			method: 'POST',
			headers: { Authorization: getAuthHeader() },
		}
	);
	console.log( await response.json() );
}

/**
 * Get latest version
 * @returns {string} Version
 */
async function getLatestVersion() {
	const type = getVersionType();
	const response = await fetch( 'https://betadownload.jetpack.me/jetpack-branches.json' );
	const manifest = await response.json();

	if ( type === 'rc' || type === 'master' ) {
		return manifest[ type ].version;
	} else if ( type === 'trunk' ) {
		return manifest.master.version;
	}
	return manifest.pr.type.version;
}

/**
 * Wait for plugin update
 */
async function waitForPluginUpdate() {
	let timesRun = 0;
	const interval = setInterval( async () => {
		console.log( 'Checking for update' );
		const expectedVersion = await getLatestVersion();
		const jpVersion = await getJetpackVersionFromSite();
		if ( expectedVersion === jpVersion ) {
			console.log( 'Update completed' );
			process.exit( 0 );
		}
		timesRun += 1;

		if ( timesRun > 20 ) {
			console.error( 'Was running for ' + timesRun * 20 + ' seconds, exiting' );
			clearInterval( interval );
			process.exit( 1 );
		}
	}, 5000 );
}

/**
 * Get version type
 * @returns {string} 'trunk' or 'rc'
 */
function getVersionType() {
	const refType = process.argv[ 2 ];
	const refName = process.argv[ 3 ];

	if ( refName === 'trunk' && refType === 'branch' ) {
		return 'trunk';
	} else if ( refType === 'tag' ) {
		return 'rc';
	}
	// TODO: cover the case for non-trunk branches, such as pushes to release branches.
	console.error( 'Invalid version type: ' + refType + ' ' + refName );
	process.exit( 0 );
	throw new Error( 'Invalid version type: ' + refType + ' ' + refName ); // Shouldn't reach this, but eslint doesn't know that.
}

/**
 * Main
 */
function main() {
	getJetpackVersionFromSite().then( version => {
		getLatestVersion().then( latestVersion => {
			console.log( 'LATEST VERSION: ', latestVersion );

			if ( latestVersion !== version ) {
				console.log( 'Forcing plugin update' );
				forcePluginUpdates().then( () => waitForPluginUpdate() );
			} else {
				console.log( 'Already up to date' );
				process.exit( 0 );
			}
		} );
	} );
}

main();
