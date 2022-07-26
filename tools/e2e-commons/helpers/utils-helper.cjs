const { execSync, exec } = require( 'child_process' );
const config = require( 'config' );
const fetch = require( 'node-fetch' );
const fs = require( 'fs' );
const path = require( 'path' );
const shellescape = require( 'shell-escape' );
const logger = require( '../logger.cjs' );
const { join } = require( 'path' );
const { E2E_DEBUG } = process.env;
const BASE_DOCKER_CMD = 'pnpm jetpack docker --type e2e --name t1';

/**
 * Executes a shell command and return it as a Promise.
 *
 * @param {string} cmd shell command
 * @return {Promise<string>} output
 */
async function execShellCommand( cmd ) {
	return new Promise( resolve => {
		let result = '';
		const cmdExec = exec( cmd, error => {
			if ( error ) {
				logger.warn( `CLI: ${ error.toString() }` );
				return resolve( error );
			}
			// return resolve( stderr );
			return resolve( result );
		} );
		const output = data => {
			// remove the new line at the end
			// data = data.replace( /\n$/, '' );
			logger.cli( data.replace( /\n$/, '' ) );
			result += data;
		};
		cmdExec.stdout.on( 'data', output );
		cmdExec.stderr.on( 'data', output );
	} );
}

function execSyncShellCommand( cmd ) {
	return execSync( cmd ).toString();
}

async function resetWordpressInstall() {
	const cmd = 'pnpm e2e-env reset';
	await cancelPartnerPlan();
	execSyncShellCommand( cmd );
}

/**
 * Provisions Jetpack plan and connects the site through Jetpack Start flow
 *
 * @param {number} userId WPCOM user ID
 * @param {string} plan   One of free, personal, premium, or professional.
 * @param {string} user   Local user name, id, or e-mail
 * @return {string} authentication URL
 */
async function provisionJetpackStartConnection( userId, plan = 'free', user = 'wordpress' ) {
	logger.info( `Provisioning Jetpack start connection [userId: ${ userId }, plan: ${ plan }]` );
	const [ clientID, clientSecret ] = config.get( 'jetpackStartSecrets' );

	const cmd = `sh ${ path.resolve(
		__dirname,
		'../../partner-provision.sh'
	) } --partner_id=${ clientID } --partner_secret=${ clientSecret } --user=${ user } --plan=${ plan } --url=${ resolveSiteUrl() } --wpcom_user_id=${ userId }`;

	const response = execSyncShellCommand( cmd );
	logger.cli( response );

	const json = JSON.parse( response );
	if ( json.success !== true ) {
		throw new Error( 'Jetpack Start provision is failed. Response: ' + response );
	}

	await execWpCommand(
		`jetpack authorize_user --user=${ user } ` + shellescape( [ `--token=${ json.access_token }` ] )
	);

	await execWpCommand( 'jetpack status' );

	return true;
}

async function cancelPartnerPlan() {
	logger.step( `Cancelling partner plan` );
	const [ clientID, clientSecret ] = config.get( 'jetpackStartSecrets' );
	const cmd = `sh /usr/local/src/jetpack-monorepo/tools/partner-cancel.sh -- --partner_id=${ clientID } --partner_secret=${ clientSecret } --allow-root`;
	await execContainerShellCommand( cmd );
}

/**
 * Runs wp cli command to activate jetpack module, also checks if the module is available in the list of active modules.
 *
 * @param {page}   page   Playwright page object
 * @param {string} module Jetpack module name
 */
async function activateModule( page, module ) {
	const cliCmd = `jetpack module activate ${ module }`;
	const activeModulesCmd = 'option get jetpack_active_modules --format=json';
	await execWpCommand( cliCmd );

	const modulesList = JSON.parse( await execWpCommand( activeModulesCmd ) );

	if ( ! modulesList.includes( module ) ) {
		throw new Error( `Failed to activate module ${ module }!` );
	}

	return true;
}

async function execWpCommand( wpCmd, sendUrl = true ) {
	const urlArgument = sendUrl ? `--url="${ resolveSiteUrl() }"` : '';
	const cmd = `${ BASE_DOCKER_CMD } wp -- ${ wpCmd } ${ urlArgument }`;
	const result = await execShellCommand( cmd );

	// Jetpack's `wp` command outputs a script header for some reason. Let's clean it up.
	if ( typeof result !== 'object' && result.length > 0 ) {
		return result.replace( '#!/usr/bin/env php\n', '' ).trim();
	}

	return result;
}

async function execContainerShellCommand( cmd ) {
	return execShellCommand( `${ BASE_DOCKER_CMD } -v exec-silent ${ cmd }` );
}

async function logDebugLog() {
	let log;
	try {
		log = execSyncShellCommand( `${ BASE_DOCKER_CMD } exec-silent cat wp-content/debug.log` );
	} catch ( error ) {
		logger.error( `Error caught when trying to save debug log! ${ error }` );
		return;
	}

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
	// const apacheLog = execSyncShellCommand( 'pnpm wp-env logs tests --watch=false' );
	const apacheLog = 'EMPTY';
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
	return { username: site.username, password: site.password, apiPassword: site.apiPassword };
}

function getDotComCredentials() {
	const site = getConfigTestSite();
	return {
		username: site.dotComAccount[ 0 ],
		password: site.dotComAccount[ 1 ],
		userId: site.dotComAccount[ 2 ],
		email: site.dotComAccount[ 3 ],
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
	return ! process.env.TEST_SITE;
}

async function logEnvironment() {
	try {
		const envFilePath = join( `${ config.get( 'dirs.output' ) }`, 'environment.json' );

		let env = { plugins: [] };

		if ( fs.existsSync( envFilePath ) ) {
			env = fs.readFileSync( envFilePath );
		}

		const credentials = getSiteCredentials();
		const plugins = await fetch( resolveSiteUrl() + '/index.php?rest_route=/wp/v2/plugins', {
			headers: {
				Authorization:
					'Basic ' +
					Buffer.from( credentials.username + ':' + credentials.apiPassword ).toString( 'base64' ),
			},
		} ).then( res => res.json() );

		for ( const p of plugins ) {
			env.plugins.push( {
				plugin: p.plugin,
				version: p.version,
				status: p.status,
			} );
		}

		fs.writeFileSync( envFilePath, JSON.stringify( env ) );
	} catch ( error ) {
		logger.error( `Logging environment details failed! ${ error }` );
	}
}

async function getJetpackVersion() {
	let version;

	try {
		const envFilePath = join( `${ config.get( 'dirs.output' ) }`, 'environment.json' );

		if ( ! fs.existsSync( envFilePath ) ) {
			await logEnvironment();
		}

		const fileContent = fs.readFileSync( envFilePath, 'utf8' );
		const env = JSON.parse( fileContent );

		const jetpack = env.plugins.filter( function ( p ) {
			return p.plugin.endsWith( '/jetpack' ) && p.status === 'active';
		} );

		version = jetpack[ 0 ].version;

		if ( process.env.GITHUB_SHA && ! process.env.TEST_SITE ) {
			version += `-${ process.env.GITHUB_SHA }`;
		}

		logger.debug( `Jetpack version: ${ version }` );
	} catch ( error ) {
		console.log( `ERROR: Failed to get Jetpack version. ${ error }` );
	}

	return version;
}

module.exports = {
	execShellCommand,
	execSyncShellCommand,
	execContainerShellCommand,
	resetWordpressInstall,
	BASE_DOCKER_CMD,
	provisionJetpackStartConnection,
	activateModule,
	execWpCommand,
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
	logEnvironment,
	getJetpackVersion,
};
