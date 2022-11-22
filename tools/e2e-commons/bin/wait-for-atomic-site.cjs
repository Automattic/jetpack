const path = require( 'path' );
const fetch = require( 'node-fetch' );

// Below call should be BEFORE requiring config, so library wil pick it up.
process.env.NODE_CONFIG_DIR = path.resolve( __dirname, '../config' );
const { resolveSiteUrl, getSiteCredentials } = require( '../helpers/utils-helper.cjs' );

function getAuthHeader() {
	const credentials = getSiteCredentials();
	return (
		'Basic ' +
		Buffer.from( credentials.username + ':' + credentials.apiPassword ).toString( 'base64' )
	);
}

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
		console.error( `Logging environment details failed! ${ error }` );
		return '';
	}
}

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

async function getLatestVersion( type = 'rc' ) {
	const response = await fetch( 'https://betadownload.jetpack.me/jetpack-branches.json' );
	const manifest = await response.json();
	return manifest[ type ].version;
}

async function waitForPluginUpdate( expectedVersion ) {
	let timesRun = 0;
	const interval = setInterval( async () => {
		console.log( 'Checking for update' );
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

function main() {
	getJetpackVersionFromSite().then( version => {
		getLatestVersion().then( latestVersion => {
			console.log( 'LATEST VERSION: ', latestVersion );

			if ( latestVersion !== version ) {
				console.log( 'Forcing plugin update' );
				forcePluginUpdates().then( () => {
					waitForPluginUpdate( latestVersion );
				} );
			} else {
				console.log( 'Already up to date' );
				process.exit( 0 );
			}
		} );
	} );
}

main();
