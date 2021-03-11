/**
 * External dependencies
 */
const { execSync, exec } = require( 'child_process' );
const config = require( 'config' );
const fs = require( 'fs' );
const path = require( 'path' );
/**
 * Internal dependencies
 */
const logger = require( './logger' ).default;
const { E2E_DEBUG } = process.env;

/**
 * Executes a shell command and return it as a Promise.
 *
 * @param {string} cmd  shell command
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
		cmdExec.stdout.on( 'data', data => logger.debug( `CLI: ${ data }` ) );
	} );
}

function execSyncShellCommand( cmd ) {
	return execSync( cmd ).toString();
}

// todo we should only read once and set a global variable
function getTunnelSiteUrl() {
	return fs
		.readFileSync( path.resolve( config.get( 'configDir' ), 'e2e_tunnels.txt' ), 'utf8' )
		.replace( 'http:', 'https:' );
}

async function resetWordpressInstall() {
	const cmd = './bin/env.sh reset';
	await execShellCommand( cmd );
}

async function prepareUpdaterTest() {
	const cmd =
		'yarn wp-env run tests-wordpress wp-content/plugins/jetpack-dev/tests/e2e/bin/prep.sh';

	await execShellCommand( cmd );
}

/**
 * Provisions Jetpack plan through Jetpack Start flow
 *
 * @param {string} plan One of free, personal, premium, or professional.
 * @param {string} user Local user name, id, or e-mail
 * @return {string} authentication URL
 */
function provisionJetpackStartConnection( plan = 'professional', user = 'wordpress' ) {
	const [ clientID, clientSecret ] = config.get( 'jetpackStartSecrets' );
	const url = getTunnelSiteUrl();

	const cmd = `sh ./bin/partner-provision.sh --partner_id=${ clientID } --partner_secret=${ clientSecret } --user=${ user } --plan=${ plan } --url=${ url }`;

	const response = execSyncShellCommand( cmd );
	logger.info( response );

	const json = JSON.parse( response );
	if ( json.success !== true ) {
		throw new Error( 'Jetpack Start provision is failed. Response: ' + response );
	}

	return json.next_url;
}

/**
 * Runs wp cli command to activate jetpack module, also checks if the module is available in the list of active modules.
 *
 * @param {page} page Playwright page object
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
	const cmd = `yarn wp-env run tests-cli "${ wpCmd }"`;

	logger.info( `CLI ${ cmd }` );
	const result = await execShellCommand( cmd );

	// By default, `wp-env run` outputs the actual command beeing run, and also adds newline to the end of the output.
	// Here we cleaning this up.
	if ( typeof result !== 'object' && result.length > 0 ) {
		return result.trim().split( '\n' ).slice( 1 ).join( '\n' );
	}

	return result;
}

/**
 * Runs multiple wp commands in a single call
 *
 * @param  {...string} commands Array of wp commands to run together
 */
async function execMultipleWpCommands( ...commands ) {
	return await execWpCommand( `bash -c '${ commands.join( ' && ' ) }'` );
}

async function logDebugLog() {
	let log = execSyncShellCommand( 'yarn wp-env run tests-wordpress cat wp-content/debug.log' );

	const escapedDate = new Date().toISOString().split( '.' )[ 0 ].replace( /:/g, '-' );
	const filename = `logs/debug_${ escapedDate }.log`;
	fs.writeFileSync( path.resolve( config.get( 'testOutputDir' ), filename ), log );

	const lines = log.split( '\n' );
	log = lines
		.filter( line => {
			return ! (
				line.startsWith( '$ ' ) ||
				line.includes( 'yarn run' ) ||
				line.includes( 'Done ' )
			);
		} )
		.join( '\n' );

	if ( log.length > 1 && E2E_DEBUG ) {
		logger.debug( '#### WP DEBUG.LOG ####' );
		logger.debug( log );
	}

	logger.slack( { message: log, type: 'debuglog' } );
}

async function logAccessLog() {
	const apacheLog = execSyncShellCommand( 'yarn wp-env logs tests --watch=false' );

	const escapedDate = new Date().toISOString().split( '.' )[ 0 ].replace( /:/g, '-' );
	const filename = `logs/access_${ escapedDate }.log`;
	fs.writeFileSync( path.resolve( config.get( 'testOutputDir' ), filename ), apacheLog );
	logger.slack( { type: 'debuglog', message: apacheLog } );
}

/**
 * Formats a given file name by replacing unaccepted characters (e.g. space)
 *
 * @param {string} filePath the file path. can be absolute file path, file name only, with or without extension
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

module.exports = {
	execShellCommand,
	execSyncShellCommand,
	getTunnelSiteUrl,
	resetWordpressInstall,
	prepareUpdaterTest,
	provisionJetpackStartConnection,
	activateModule,
	execWpCommand,
	execMultipleWpCommands,
	logDebugLog,
	logAccessLog,
	fileNameFormatter,
};
