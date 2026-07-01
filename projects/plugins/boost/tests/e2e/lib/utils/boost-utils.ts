import logger from '@automattic/_jetpack-e2e-commons/logger';
import {
	executeJetpackCommand,
	executeWpCommand,
} from '@automattic/_jetpack-e2e-commons/utils/cli';
import { expect, type Page } from '@playwright/test';
import { JetpackBoostPage } from '../pages/index';

/**
 * Executes a Jetpack Boost CLI command.
 *
 * @param {string | string[]} command - Jetpack Boost CLI command (without 'jetpack-boost' prefix)
 * @return {Promise<string>} Command output
 */
export async function executeJetpackBoostCommand( command: string | string[] ): Promise< string > {
	if ( Array.isArray( command ) ) {
		return executeWpCommand( [ 'jetpack-boost', ...command ] );
	}
	return executeWpCommand( `jetpack-boost ${ command }` );
}

/**
 * Activates one or more Jetpack modules
 *
 * @param {string|string[]} modules - Jetpack module name(s) to activate
 * @return {Promise<void>}
 */
export async function activateBoostModule( modules: string | string[] ): Promise< void > {
	const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
	for ( const mod of moduleArray ) {
		await executeJetpackBoostCommand( `module activate ${ mod }` );
	}
}

/**
 * Deactivates one or more Jetpack modules
 *
 * @param {string|string[]} modules - Jetpack module name(s) to deactivate
 * @return {Promise<void>}
 */
export async function deactivateBoostModule( modules: string | string[] ): Promise< void > {
	const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
	for ( const mod of moduleArray ) {
		await executeJetpackBoostCommand( `module deactivate ${ mod }` );
	}
}

/**
 * Check the connection status and returns the state as a boolean.
 * @return {Promise<boolean>} - Connection state.
 */
export async function isConnected(): Promise< boolean > {
	const result = await executeJetpackBoostCommand( 'connection status' );

	// If result is a string, check if it's 'connected'
	if ( typeof result === 'string' ) {
		logger.debug( `Connection status: ${ result.trim() }` );
		return result.trim() === 'connected';
	}

	logger.debug( 'Jetpack Boost is not connected' );
	return false;
}

/**
 * Connects Jetpack Boost if not already connected.
 * @param  page - The Playwright Page object.
 * @return {Promise<void>} - Returns a promise that resolves when the connection is established or already connected.
 */
export async function connectIfNeeded( page: Page ): Promise< void > {
	if ( ! ( await isConnected() ) ) {
		logger.debug( 'Connecting Jetpack Boost...' );
		const jetpackBoostPage = new JetpackBoostPage( page );
		await jetpackBoostPage.visit();
		await jetpackBoostPage.connect();
	} else {
		logger.debug( 'Jetpack Boost is already connected.' );
	}
}

/**
 * Disconnect Jetpack.
 */
export async function disconnect() {
	logger.debug( 'Disconnecting Jetpack...' );
	const result = await executeJetpackCommand( 'disconnect blog' );
	expect( result ).toContain( 'Success:' );
}

/**
 * Mock connection.
 */
export async function mockConnection() {
	logger.debug( 'Mocking connection' );
	await executeWpCommand( 'plugin activate e2e-mock-boost-connection' );
	// Update the WP option jb_get_started to false.
	await executeWpCommand( 'option update jb_get_started 0' );
}

/**
 * Unmock connection by deactivating the e2e-mock-boost-connection plugin and updating the jb_get_started option.
 */
export async function unMockConnection() {
	logger.debug( 'Unmocking connection' );
	await executeWpCommand( 'plugin deactivate e2e-mock-boost-connection' );
	// Update the WP option jb_get_started to true.
	await executeWpCommand( 'option update jb_get_started 1' );
}

/**
 * Mocks the Speed Score state by activating the e2e-mock-speed-score-api plugin.
 */
export async function mockSpeedScore() {
	logger.debug( 'Mocking Speed Score state...' );
	await executeWpCommand( 'plugin activate e2e-mock-speed-score-api' );
}

/**
 * Unmocks the Speed Score state by deactivating the e2e-mock-speed-score-api plugin.
 */
export async function unMockSpeedScore() {
	logger.debug( 'Unmocking Speed Score state...' );
	await executeWpCommand( 'plugin deactivate e2e-mock-speed-score-api' );
}

/**
 * Mocks the Premium Features by activating the e2e-mock-premium-features plugin and setting the features to mock.
 * @param {string[]} features - Array of premium features to mock
 */
export async function mockPremiumFeatures( features: string[] ) {
	logger.debug( 'Mocking Premium Features...' );
	await executeWpCommand( 'plugin activate e2e-mock-premium-features' );
	const featuresJson = JSON.stringify( features );
	await executeWpCommand( [
		'option',
		'update',
		'e2e_mock_premium_features',
		featuresJson,
		'--format=json',
	] );
}

/**
 * Unmocks the Premium Features
 */
export async function unMockPremiumFeatures() {
	logger.debug( 'Unmocking Premium Features...' );
	await executeWpCommand( 'plugin deactivate e2e-mock-premium-features' );
	await executeWpCommand( 'option delete e2e_mock_premium_features' );
}

/**
 * Create test posts if they do not exist.
 * @param {string[]} testPostTitles - Predefined post titles to create.
 */
export async function createTestPosts( testPostTitles: string[] ): Promise< void > {
	const testPostTitlesCommands = {
		'Hello World with image': [
			'post',
			'create',
			'--post_status=publish',
			'--post_title=Hello World with image',
			'--post_content=<h1>Hello World with image</h1><div><p>This is just a test post with an image</p><img src="https://picsum.photos/seed/picsum/600/600" alt="placeholder Image"></div>',
		],
		'Hello World with JavaScript': [
			'post',
			'create',
			'--post_status=publish',
			'--post_title=Hello World with JavaScript',
			'--post_content=<h1>Hello World with JavaScript</h1><div class="render-blocking-js"><script id="blockingScript">document.getElementById("testDiv").style.display = "block";</script></div><div id="testDiv" style="display: none">This is made visible by JavaScript</div>',
		],
	};
	for ( const testPostTitle of testPostTitles ) {
		if ( testPostTitle in testPostTitlesCommands ) {
			const result = await executeWpCommand( 'post list --fields=post_title' );
			if ( result.includes( testPostTitle ) ) {
				logger.debug( 'The test content post already exists' );
			} else {
				logger.debug( 'Creating test content post...' );
				await executeWpCommand(
					testPostTitlesCommands[ testPostTitle as keyof typeof testPostTitlesCommands ]
				);
			}
		}
	}
}

/**
 * Reset the environment.
 */
export async function resetEnvironment() {
	logger.debug( 'Resetting Jetpack Boost' );
	await executeWpCommand( 'plugin activate jetpack-boost' );
	await disconnect();
	await unMockConnection();
	await executeWpCommand( 'jetpack-boost reset' );
}
