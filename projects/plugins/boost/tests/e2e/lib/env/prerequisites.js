import { expect } from '@playwright/test';
import logger from '_jetpack-e2e-commons/logger.js';
import { executeWpCommand } from '_jetpack-e2e-commons/utils/cli.ts';
import { JetpackBoostPage } from '../pages/index.js';

/**
 * Create a prerequisites builder.
 * @param {page} page - Playwright page instance.
 * @return {object} Builder
 */
export function boostPrerequisitesBuilder( page ) {
	const state = {
		testPostTitles: [],
		clean: undefined,
		modules: { active: undefined, inactive: undefined },
		connected: undefined,
		mockConnection: undefined,
		jetpackDeactivated: undefined,
		mockSpeedScore: undefined,
		mockPremiumFeatures: undefined,
		enqueuedAssets: undefined,
		appendImage: undefined,
	};

	return {
		withConnection( shouldBeConnected ) {
			state.connected = shouldBeConnected;
			return this;
		},
		withMockConnection( shouldBeMocked ) {
			state.mockConnection = shouldBeMocked;
			return this;
		},
		withTestContent( testPostTitles = [] ) {
			state.testPostTitles = testPostTitles;
			return this;
		},
		withSpeedScoreMocked( shouldMockSpeedScore ) {
			state.mockSpeedScore = shouldMockSpeedScore;
			return this;
		},
		withPremiumFeaturesMocked( features = [] ) {
			state.mockPremiumFeatures = features;
			return this;
		},
		withEnqueuedAssets( shouldEnqueueAssets ) {
			state.enqueuedAssets = shouldEnqueueAssets;
			return this;
		},
		withAppendedImage( shouldAppendImage ) {
			state.appendImage = shouldAppendImage;
			return this;
		},
		withCleanEnv() {
			state.clean = true;
			return this;
		},
		async build() {
			await buildPrerequisites( state, page );
		},
	};
}

/**
 * Build prerequisites.
 * @param {object}  state                     - State
 * @param {boolean} state.clean               - Whether to reset the environment.
 * @param {boolean} state.connected           - Whether the site should be connected.
 * @param {object}  state.plugins             - Plugins state, see ensurePluginsState()
 * @param {object}  state.modules             - Modules state, see ensureModulesState()
 * @param {Array}   state.testPostTitles      -
 * @param {boolean} state.mockSpeedScore      -
 * @param {Array}   state.mockPremiumFeatures - Premium features to mock
 * @param {boolean} state.enqueuedAssets      -
 * @param {boolean} state.appendImage         -
 * @param {page}    page                      - Playwright page instance.
 */
async function buildPrerequisites( state, page ) {
	const functions = {
		modules: () => ensureModulesState( state.modules ),
		connected: () => ensureConnectedState( state.connected, page ),
		mockConnection: () => ensureMockConnectionState( state.mockConnection ),
		testPostTitles: () => ensureTestPosts( state.testPostTitles ),
		clean: () => ensureCleanState( state.clean ),
		mockSpeedScore: () => ensureMockSpeedScoreState( state.mockSpeedScore ),
		mockPremiumFeatures: () => ensureMockPremiumFeaturesState( state.mockPremiumFeatures ),
		enqueuedAssets: () => ensureEnqueuedAssets( state.enqueuedAssets ),
		appendImage: () => ensureAppendedImage( state.appendImage ),
	};

	logger.prerequisites( JSON.stringify( state, null, 2 ) );

	for ( const option of Object.keys( state ) ) {
		if ( state[ option ] !== undefined ) {
			if ( functions[ option ] ) {
				logger.prerequisites( `Ensuring '${ option }' prerequisite state` );
				await functions[ option ]();
			} else {
				throw Error( `Unknown state "${ option }: ${ state[ option ] }"!` );
			}
		}
	}
}

/**
 * Ensure modules are active/inactive
 * @param {object}   modules          - State
 * @param {string[]} modules.active   - Modules to activate.
 * @param {string[]} modules.inactive - Modules to deactivate.
 */
export async function ensureModulesState( modules ) {
	if ( modules.active ) {
		await activateModules( modules.active );
	} else {
		logger.prerequisites( 'Cannot find list of modules to activate!' );
	}

	if ( modules.inactive ) {
		await deactivateModules( modules.inactive );
	} else {
		logger.prerequisites( 'Cannot find list of modules to deactivate!' );
	}
}

/**
 * Ensure speed score mock plugin state.
 * @param {boolean} mockSpeedScore - Whether mocking plugin is active.
 */
export async function ensureMockSpeedScoreState( mockSpeedScore ) {
	if ( mockSpeedScore ) {
		logger.prerequisites( 'Mocking Speed Score' );
		// Enable the speed score mock plugin.
		await executeWpCommand( 'plugin activate e2e-mock-speed-score-api' );
	} else {
		logger.prerequisites( 'Unmocking Speed Score' );
		await executeWpCommand( 'plugin deactivate e2e-mock-speed-score-api' );
	}
}

/**
 * Ensure premium features mock plugin state.
 * @param {Array} mockPremiumFeatures - Array of premium features to mock.
 */
export async function ensureMockPremiumFeaturesState( mockPremiumFeatures ) {
	if ( mockPremiumFeatures && mockPremiumFeatures.length > 0 ) {
		logger.prerequisites( `Mocking Premium Features: ${ mockPremiumFeatures.join( ', ' ) }` );
		// Enable the premium features mock plugin.
		await executeWpCommand( 'plugin activate e2e-mock-premium-features' );
		// Set the features to mock as a proper PHP array using WP-CLI's --format=json
		const featuresJson = JSON.stringify( mockPremiumFeatures );
		await executeWpCommand( [
			'option',
			'update',
			'e2e_mock_premium_features',
			featuresJson,
			'--format=json',
		] );
	} else {
		logger.prerequisites( 'Unmocking Premium Features' );
		await executeWpCommand( 'plugin deactivate e2e-mock-premium-features' );
		await executeWpCommand( 'option delete e2e_mock_premium_features' );
	}
}

/**
 * Ensure enqueued assets mock plugin state.
 * @param {boolean} enqueue - Whether mocking plugin is active.
 */
export async function ensureEnqueuedAssets( enqueue ) {
	if ( enqueue ) {
		logger.prerequisites( 'Enqueuing assets' );
		await executeWpCommand( 'plugin activate e2e-concatenate-enqueue/e2e-concatenate-enqueue.php' );
	} else {
		logger.prerequisites( 'Deactivating assets' );
		await executeWpCommand(
			'plugin deactivate e2e-concatenate-enqueue/e2e-concatenate-enqueue.php'
		);
	}
}

/**
 * Ensure append image mock plugin state.
 * @param {boolean} append - Whether mocking plugin is active.
 */
export async function ensureAppendedImage( append ) {
	if ( append ) {
		logger.prerequisites( 'Appending image' );
		await executeWpCommand( 'plugin activate e2e-appended-image/e2e-appended-image.php' );
	} else {
		logger.prerequisites( 'Removing appended image' );
		await executeWpCommand( 'plugin deactivate e2e-appended-image/e2e-appended-image.php' );
	}
}

/**
 * Activate modules.
 * @param {string[]} modules - Modules
 */
export async function activateModules( modules ) {
	for ( const module of modules ) {
		logger.prerequisites( `Activating module ${ module }` );
		const result = await executeWpCommand( `jetpack-boost module activate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been activated.`, 'i' ) );
	}
}

/**
 * Deactivate modules.
 * @param {string[]} modules - Modules
 */
export async function deactivateModules( modules ) {
	for ( const module of modules ) {
		logger.prerequisites( `Deactivating module ${ module }` );
		const result = await executeWpCommand( `jetpack-boost module deactivate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been deactivated.`, 'i' ) );
	}
}

/**
 * Ensure connected state.
 * @param {boolean} requiredConnected - Whether the site should be connected.
 * @param {page}    page              - Playwright page instance.
 */
export async function ensureConnectedState( requiredConnected, page ) {
	// Ensure the mock connection plugin is deactivated.
	await executeWpCommand( 'plugin deactivate e2e-mock-boost-connection' );

	const isConnected = await checkIfConnected();

	if ( requiredConnected && isConnected ) {
		logger.prerequisites( 'Jetpack Boost is already connected, moving on' );
	} else if ( requiredConnected && ! isConnected ) {
		logger.prerequisites( 'Connecting Jetpack Boost' );
		await connect( page );
	} else if ( ! requiredConnected && isConnected ) {
		logger.prerequisites( 'Disconnecting Jetpack Boost' );
		await disconnect();
	} else {
		logger.prerequisites( 'Jetpack Boost is already disconnected, moving on' );
	}
}

/**
 * Ensure mock connection state.
 * @param {boolean} mockConnection - Whether the site should be connected.
 */
export async function ensureMockConnectionState( mockConnection ) {
	if ( mockConnection ) {
		logger.prerequisites( 'Mocking connection' );
		await executeWpCommand( 'plugin activate e2e-mock-boost-connection' );
		// Update the WP option jb_get_started to false.
		await executeWpCommand( 'option update jb_get_started 0' );
	} else {
		logger.prerequisites( 'Unmocking connection' );
		await executeWpCommand( 'plugin deactivate e2e-mock-boost-connection' );
		// Update the WP option jb_get_started to true.
		await executeWpCommand( 'option update jb_get_started 1' );
	}
}

/**
 * Connect.
 * @param {page} page - Playwright page instance.
 */
export async function connect( page ) {
	const jetpackBoostPage = await JetpackBoostPage.visit( page );
	await jetpackBoostPage.chooseFreePlan();
	await jetpackBoostPage.expectScoreToBeLoading();
}

/**
 * Disconnect.
 */
export async function disconnect() {
	logger.prerequisites( `Disconnecting Boost plugin to WP.com` );
	const cliCmd = 'jetpack disconnect blog';
	const result = await executeWpCommand( cliCmd );
	expect( result ).toContain( 'Success: Jetpack has been successfully disconnected' );
}

/**
 * Check if connected.
 * @return {boolean} If connected.
 */
export async function checkIfConnected() {
	const cliCmd = 'jetpack-boost connection status';
	const result = await executeWpCommand( cliCmd );

	// If result is a string, check if it's 'connected'
	if ( typeof result === 'string' ) {
		return result.trim() === 'connected';
	}

	// If result is an error object, check the error message
	const txt = result.toString();
	if ( txt.includes( "Error: 'jetpack-boost' is not a registered wp command" ) ) {
		return false;
	}

	// For other errors, return false instead of throwing
	return false;
}

/**
 * Ensure test posts exist.
 * @param {string[]} testPostTitles - Predefined post titles to create.
 */
async function ensureTestPosts( testPostTitles ) {
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
				logger.prerequisites( 'The test content post already exists' );
			} else {
				logger.prerequisites( 'Creating test content post...' );
				await executeWpCommand( testPostTitlesCommands[ testPostTitle ] );
			}
		}
	}
}

/**
 * Reset environment.
 * @param {boolean} shouldReset - Whether to actually do it.
 */
async function ensureCleanState( shouldReset ) {
	if ( shouldReset ) {
		logger.prerequisites( 'Resetting Jetpack Boost' );
		await executeWpCommand( 'plugin activate jetpack-boost' );
		await executeWpCommand( 'jetpack-boost reset' );
	}
}
