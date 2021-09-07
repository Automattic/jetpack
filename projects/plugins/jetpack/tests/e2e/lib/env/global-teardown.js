const os = require( 'os' );
const rimraf = require( 'rimraf' );
const path = require( 'path' );
const {
	logDebugLog,
	logAccessLog,
	getSiteCredentials,
	resolveSiteUrl,
} = require( '../utils-helper' );
const { join } = require( 'path' );
const config = require( 'config' );
const fs = require( 'fs' );
const WordpressAPI = require( '../api/wp-api' );
const logger = require( '../logger' );
const DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

async function logEnvironment() {
	try {
		const envFilePath = join(
			`${ config.get( 'dirs.output' ) }/allure-results`,
			'environment.properties'
		);

		let envContent = '';

		if ( fs.existsSync( envFilePath ) ) {
			envContent = fs.readFileSync( envFilePath );
		}

		const wpApi = new WordpressAPI( getSiteCredentials(), resolveSiteUrl() );
		const jetpackVersion = await wpApi.getPluginVersion( 'jetpack' );
		envContent += `\njetpack_version=${ jetpackVersion }`;

		fs.writeFileSync( envFilePath, envContent );
	} catch ( error ) {
		logger.error( `Logging environment details failed! ${ error }` );
	}
}

module.exports = async function () {
	// Close browser
	await global.browser.close();
	rimraf.sync( DIR );

	await logDebugLog();
	await logAccessLog();
	await logEnvironment();
};
