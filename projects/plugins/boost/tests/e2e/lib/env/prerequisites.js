import { expect } from '@playwright/test';
import { ensureUserIsLoggedIn } from '_jetpack-e2e-commons/env/prerequisites.js';
import { execWpCommand } from '_jetpack-e2e-commons/helpers/utils-helper.js';
import logger from '_jetpack-e2e-commons/logger.js';
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
		loggedIn: undefined,
		modules: { active: undefined, inactive: undefined },
		connected: undefined,
		jetpackDeactivated: undefined,
		mockSpeedScore: undefined,
		enqueuedAssets: undefined,
		appendImage: undefined,
	};

	return {
		withActiveModules( modules = [] ) {
			state.modules.active = modules;
			return this;
		},
		withInactiveModules( modules = [] ) {
			state.modules.inactive = modules;
			return this;
		},
		withLoggedIn( shouldBeLoggedIn ) {
			state.loggedIn = shouldBeLoggedIn;
			return this;
		},
		withConnection( shouldBeConnected ) {
			state.connected = shouldBeConnected;
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
 * @param {object}  state                - State
 * @param {boolean} state.clean          - Whether to reset the environment.
 * @param {boolean} state.connected      - Whether the site should be connected.
 * @param {object}  state.plugins        - Plugins state, see ensurePluginsState()
 * @param {object}  state.modules        - Modules state, see ensureModulesState()
 * @param {Array}   state.loggedIn       -
 * @param {Array}   state.testPostTitles -
 * @param {boolean} state.mockSpeedScore -
 * @param {boolean} state.enqueuedAssets -
 * @param {boolean} state.appendImage    -
 * @param {page}    page                 - Playwright page instance.
 */
async function buildPrerequisites( state, page ) {
	const functions = {
		modules: () => ensureModulesState( state.modules ),
		loggedIn: () => ensureUserIsLoggedIn( page ),
		connected: () => ensureConnectedState( state.connected, page ),
		testPostTitles: () => ensureTestPosts( state.testPostTitles ),
		clean: () => ensureCleanState( state.clean ),
		mockSpeedScore: () => ensureMockSpeedScoreState( state.mockSpeedScore ),
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
		await execWpCommand( 'plugin activate e2e-mock-speed-score-api' );
	} else {
		logger.prerequisites( 'Unmocking Speed Score' );
		await execWpCommand( 'plugin deactivate e2e-mock-speed-score-api' );
	}
}

/**
 * Ensure enqueued assets mock plugin state.
 * @param {boolean} enqueue - Whether mocking plugin is active.
 */
export async function ensureEnqueuedAssets( enqueue ) {
	if ( enqueue ) {
		logger.prerequisites( 'Enqueuing assets' );
		await execWpCommand( 'plugin activate e2e-concatenate-enqueue/e2e-concatenate-enqueue.php' );
	} else {
		logger.prerequisites( 'Deactivating assets' );
		await execWpCommand( 'plugin deactivate e2e-concatenate-enqueue/e2e-concatenate-enqueue.php' );
	}
}

/**
 * Ensure append image mock plugin state.
 * @param {boolean} append - Whether mocking plugin is active.
 */
export async function ensureAppendedImage( append ) {
	if ( append ) {
		logger.prerequisites( 'Appending image' );
		await execWpCommand( 'plugin activate e2e-appended-image/e2e-appended-image.php' );
	} else {
		logger.prerequisites( 'Removing appended image' );
		await execWpCommand( 'plugin deactivate e2e-appended-image/e2e-appended-image.php' );
	}
}

/**
 * Activate modules.
 * @param {string[]} modules - Modules
 */
export async function activateModules( modules ) {
	for ( const module of modules ) {
		logger.prerequisites( `Activating module ${ module }` );
		const result = await execWpCommand( `jetpack-boost module activate ${ module }` );
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
		const result = await execWpCommand( `jetpack-boost module deactivate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been deactivated.`, 'i' ) );
	}
}

/**
 * Ensure connected state.
 * @param {boolean} requiredConnected - Whether the site should be connected.
 * @param {page}    page              - Playwright page instance.
 */
export async function ensureConnectedState( requiredConnected, page ) {
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
 * Connect.
 * @param {page} page - Playwright page instance.
 */
export async function connect( page ) {
	const jetpackBoostPage = await JetpackBoostPage.visit( page );
	await jetpackBoostPage.chooseFreePlan();
	await jetpackBoostPage.isOverallScoreHeaderShown();
}

/**
 * Disconnect.
 */
export async function disconnect() {
	logger.prerequisites( `Disconnecting Boost plugin to WP.com` );
	const cliCmd = 'jetpack disconnect blog';
	const result = await execWpCommand( cliCmd );
	expect( result ).toContain( 'Success: Jetpack has been successfully disconnected' );
}

/**
 * Check if connected.
 * @return {boolean} If connected.
 */
export async function checkIfConnected() {
	const cliCmd = 'jetpack-boost connection status';
	const result = await execWpCommand( cliCmd );
	if ( typeof result !== 'object' ) {
		return result === 'connected';
	}
	const txt = result.toString();
	if ( txt.includes( "Error: 'jetpack-boost' is not a registered wp command" ) ) {
		return false;
	}
	throw result;
}

/**
 * Ensure test posts exist.
 * @param {string[]} testPostTitles - Predefined post titles to create.
 */
async function ensureTestPosts( testPostTitles ) {
	const testPostTitlesCommands = {
		'Hello World with image':
			"post create --post_status='publish' --post_title='Hello World with image' --post_content='<h1>Hello World with image</h1><div><p>This is just a test post with an image</p><img src=\"https://picsum.photos/seed/picsum/600/600\" alt=\"placeholder Image\"></div>'",
		'Hello World with JavaScript':
			'post create --post_status=\'publish\' --post_title=\'Hello World with JavaScript\' --post_content=\'<h1>Hello World with JavaScript</h1><div class="render-blocking-js"><script id="blockingScript">document.getElementById("testDiv").style.display = "block";</script></div><div id="testDiv" style="display: none">This is made visible by JavaScript</div>\'',
	};
	for ( const testPostTitle of testPostTitles ) {
		if ( testPostTitle in testPostTitlesCommands ) {
			const result = await execWpCommand( 'post list --fields=post_title' );
			if ( result.includes( testPostTitle ) ) {
				logger.prerequisites( 'The test content post already exists' );
			} else {
				logger.prerequisites( 'Creating test content post...' );
				await execWpCommand( testPostTitlesCommands[ testPostTitle ] );
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
		await execWpCommand( 'jetpack-boost reset' );
	}
}
