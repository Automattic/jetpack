/**
 * External dependencies
 */
const { execSync, exec } = require( 'child_process' );
const config = require( 'config' );
const fs = require( 'fs' );
const path = require( 'path' );
const shellescape = require( 'shell-escape' );
const logger = require( './logger' );
const { E2E_DEBUG } = process.env;

/**
 * Executes a shell command and return it as a Promise.
 *
 * @param {string} cmd shell command
 * @return {Promise<string>} output
 */
async function execShellCommand( cmd ) {
	return new Promise( resolve => {
		const cmdExec = exec( cmd, ( error, stdout ) => {
			if ( error ) {
				logger.warn( `CLI: ${ error.toString() }` );
				return resolve( error );
			}
			return resolve( stdout );
		} );
		cmdExec.stdout.on( 'data', data => {
			// remove the new line at the end
			data = data.replace( /\n$/, '' );
			logger.cli( `${ data }` );
		} );
	} );
}

function execSyncShellCommand( cmd ) {
	return execSync( cmd ).toString();
}

async function resetWordpressInstall() {
	const cmd = './bin/env.sh reset';
	await execShellCommand( cmd );
}

async function prepareUpdaterTest() {
	const cmd =
		'pnpx wp-env run tests-wordpress wp-content/plugins/jetpack-dev/tests/e2e/bin/prep.sh';

	await execShellCommand( cmd );
}

/**
 * Provisions Jetpack plan and connects the site through Jetpack Start flow
 *
 * @param {number} userId WPCOM user ID
 * @param {string} plan   One of free, personal, premium, or professional.
 * @param {string} user   Local user name, id, or e-mail
 * @return {string} authentication URL
 */
async function provisionJetpackStartConnection( userId, plan = 'free', user = 'admin' ) {
	logger.info( `Provisioning Jetpack start connection [userId: ${ userId }, plan: ${ plan }]` );
	const [ clientID, clientSecret ] = config.get( 'jetpackStartSecrets' );

	const cmd = `sh ../../../../../tools/partner-provision.sh --partner_id=${ clientID } --partner_secret=${ clientSecret } --user=${ user } --plan=${ plan } --url=${ siteUrl } --wpcom_user_id=${ userId }`;

	const response = execSyncShellCommand( cmd );
	logger.cli( response );

	const json = JSON.parse( response );
	if ( json.success !== true ) {
		throw new Error( 'Jetpack Start provision is failed. Response: ' + response );
	}

	const out = execSyncShellCommand(
		shellescape( [
			'pnpx',
			'wp-env',
			'run',
			'tests-cli',
			shellescape( [
				'wp',
				'--user=admin',
				'jetpack',
				'authorize_user',
				`--token=${ json.access_token }`,
			] ),
		] )
	);
	logger.cli( out );

	return true;
}

/**
 * Runs wp cli command to activate jetpack module, also checks if the module is available in the list of active modules.
 *
 * @param {page}   page   Playwright page object
 * @param {string} module Jetpack module name
 */
async function activateModule( page, module ) {
	const cliCmd = `wp jetpack module activate ${ module }`;
	const activeModulesCmd = 'wp option get jetpack_active_modules --format=json';
	await execWpCommand( cliCmd );

	const modulesList = JSON.parse( await execWpCommand( activeModulesCmd ) );

	if ( ! modulesList.includes( module ) ) {
		throw new Error( `${ module } failed to activate` );
	}

	// todo we shouldn't have page references in here. these methods could be called without a browser being opened
	await page.waitForTimeout( 1000 );
	await page.reload( { waitUntil: 'domcontentloaded' } );

	return true;
}

async function execWpCommand( wpCmd ) {
	const cmd = `pnpx wp-env run tests-cli "${ wpCmd }"`;
	const result = await execShellCommand( cmd );

	// By default, `wp-env run` adds a newline to the end of the output.
	// Here we clean this up.
	if ( typeof result !== 'object' && result.length > 0 ) {
		return result.trim();
	}

	return result;
}

/**
 * Runs multiple wp commands in a single call
 *
 * @param {...string} commands Array of wp commands to run together
 */
async function execMultipleWpCommands( ...commands ) {
	return await execWpCommand( `bash -c '${ commands.join( ' && ' ) }'` );
}

async function logDebugLog() {
	let log = execSyncShellCommand( 'pnpx wp-env run tests-wordpress cat wp-content/debug.log' );

	const escapedDate = new Date().toISOString().split( '.' )[ 0 ].replace( /:/g, '-' );
	const filename = `debug_${ escapedDate }.log`;
	fs.writeFileSync( path.resolve( config.get( 'dirs.logs' ), filename ), log );

	const lines = log.split( '\n' );
	log = lines
		.filter( line => {
			return ! (
				line.startsWith( '> ' ) ||
				line.includes( 'pnpm run' ) ||
				line.includes( 'Done ' )
			);
		} )
		.join( '\n' );

	if ( log.length > 1 && E2E_DEBUG ) {
		logger.debug( '#### WP DEBUG.LOG ####' );
		logger.debug( log );
	}
}

async function logAccessLog() {
	const apacheLog = execSyncShellCommand( 'pnpx wp-env logs tests --watch=false' );

	const escapedDate = new Date().toISOString().split( '.' )[ 0 ].replace( /:/g, '-' );
	const filename = `access_${ escapedDate }.log`;
	fs.writeFileSync( path.resolve( config.get( 'dirs.logs' ), filename ), apacheLog );
}

/**
 * Formats a given file name by replacing unaccepted characters (e.g. space)
 *
 * @param {string}  filePath         the file path. can be absolute file path, file name only, with or without extension
 * @param {boolean} includeTimestamp if true, the current timestamp will be added as a prefix
 * @return {string} the formatted file path
 */
function fileNameFormatter( filePath, includeTimestamp = true ) {
	const parts = path.parse( path.normalize( filePath ) );
	let fileName = parts.name;
	const ext = parts.ext;
	const dirname = parts.dir;

	if ( includeTimestamp ) {
		fileName = `${ Date.now() }_${ fileName }`;
	}

	fileName = fileName.replace( /\W/g, '_' );

	return path.join( dirname, `${ fileName }${ ext }` );
}

function getConfigTestSite() {
	const testSite = process.env.TEST_SITE ? process.env.TEST_SITE : 'default';
	logger.debug( `Using '${ testSite }' test site config` );
	return config.get( `testSites.${ testSite }` );
}

function getSiteCredentials() {
	const site = getConfigTestSite();
	return { username: site.username, password: site.password };
}

function getDotComCredentials() {
	const site = getConfigTestSite();
	return {
		username: site.dotComAccount[ 0 ],
		password: site.dotComAccount[ 1 ],
		userId: site.dotComAccount[ 2 ],
	};
}

function getMailchimpCredentials() {
	const site = getConfigTestSite();
	return {
		username: site.mailchimpLogin[ 0 ],
		password: site.mailchimpLogin[ 1 ],
	};
}

/**
 * Reads and returns the content of the file expected to store an URL.
 * The file path is stored in config.
 * No validation is done on the file content, so an invalid URL can be returned.
 *
 * @return {string} the file content, or undefined in file doesn't exist or cannot be read
 */
function getReusableUrlFromFile() {
	let urlFromFile;
	try {
		urlFromFile = fs
			.readFileSync( config.get( 'temp.tunnels' ), 'utf8' )
			.replace( 'http:', 'https:' );
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			// We expect this, reduce noise in logs
			console.warn( "Tunnels file doesn't exist" );
		} else {
			console.error( error );
		}
	}
	return urlFromFile;
}

/**
 * There are two ways to set the target site url:
 * 1. Write it in 'temp.tunnels' file
 * 2. Configure a test site in local config and use a TEST_SITE env variable with the config property name. This overrides any value written in file
 * If none of the above is valid we throw an error
 */
function resolveSiteUrl() {
	let url;

	if ( process.env.TEST_SITE ) {
		url = config.get( `testSites.${ process.env.TEST_SITE }` ).get( 'url' );
	} else {
		logger.debug( 'Checking for existing tunnel url' );
		url = getReusableUrlFromFile();
	}

	validateUrl( url );
	logger.debug( `Using site ${ url }` );
	return url;
}

/**
 * Throw an error if the passed parameter is not a valid URL
 *
 * @param {string} url the string to to be validated as URL
 */
function validateUrl( url ) {
	if ( ! new URL( url ) ) {
		throw new Error( `Undefined or invalid url!` );
	}
}

/**
 * Checks if the test site is a local one, with wp-cli accessible or a remote one
 *
 * @return {boolean} true if site is local
 */
function isLocalSite() {
	return !! process.env.TEST_SITE;
}

module.exports = {
	execShellCommand,
	execSyncShellCommand,
	resetWordpressInstall,
	prepareUpdaterTest,
	provisionJetpackStartConnection,
	activateModule,
	execWpCommand,
	execMultipleWpCommands,
	logDebugLog,
	logAccessLog,
	fileNameFormatter,
	getReusableUrlFromFile,
	resolveSiteUrl,
	validateUrl,
	isLocalSite,
	getSiteCredentials,
	getDotComCredentials,
	getMailchimpCredentials,
};
