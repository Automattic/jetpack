import logger from 'jetpack-e2e-commons/logger.cjs';
import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

import { expect } from '@playwright/test';
import { JetpackBoostPage } from '../pages/index.js';

export function boostPrerequisitesBuilder( page ) {
	const state = {
		testPostTitles: [],
		clean: undefined,
		modules: { active: undefined, inactive: undefined },
		connected: undefined,
		jetpackDeactivated: undefined,
		mockSpeedScore: undefined,
		gotStarted: undefined,
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
		withCleanEnv() {
			state.clean = true;
			return this;
		},
		withGotStarted() {
			state.gotStarted = true;
			return this;
		},
		async build() {
			await buildPrerequisites( state, page );
		},
	};
}

async function buildPrerequisites( state, page ) {
	const functions = {
		modules: () => ensureModulesState( state.modules ),
		connected: () => ensureConnectedState( state.connected, page ),
		testPostTitles: () => ensureTestPosts( state.testPostTitles ),
		clean: () => ensureCleanState( state.clean ),
		mockSpeedScore: () => ensureMockSpeedScoreState( state.mockSpeedScore ),
		gotStarted: () => ensureGotStartedState( state.gotStarted, page ),
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

export async function ensureGotStartedState( shouldGetStarted ) {
	if ( shouldGetStarted ) {
		logger.prerequisites( 'Disabling getting started' );
		await execWpCommand( 'jetpack-boost getting_started false' );
	}
}

export async function activateModules( modules ) {
	for ( const module of modules ) {
		logger.prerequisites( `Activating module ${ module }` );
		const result = await execWpCommand( `jetpack-boost module activate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been activated.`, 'i' ) );
	}
}

export async function deactivateModules( modules ) {
	for ( const module of modules ) {
		logger.prerequisites( `Deactivating module ${ module }` );
		const result = await execWpCommand( `jetpack-boost module deactivate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been deactivated.`, 'i' ) );
	}
}

export async function ensureConnectedState( requiredConnected = undefined, page ) {
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

export async function connect( page ) {
	logger.prerequisites( `Connecting Boost plugin to WP.com` );
	// Boost cannot be connected to WP.com using the WP-CLI because the site is considered
	// as a localhost site. The only solution is to do it via the site itself running under the localtunnel.
	const jetpackBoostPage = await JetpackBoostPage.visit( page );
	await jetpackBoostPage.connect();
	await jetpackBoostPage.isOverallScoreHeaderShown();
}

export async function disconnect() {
	logger.prerequisites( `Disconnecting Boost plugin to WP.com` );
	const cliCmd = 'jetpack-boost connection deactivate';
	const result = await execWpCommand( cliCmd );
	expect( result ).toEqual( 'Success: Boost is disconnected from WP.com' );
}

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

async function ensureCleanState( shouldReset ) {
	if ( shouldReset ) {
		logger.prerequisites( 'Resetting Jetpack Boost' );
		await execWpCommand( 'jetpack-boost reset' );
	}
}
