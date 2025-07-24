import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import {
	executeCommand,
	executeContainerCommand,
	executeWpCommand,
	executeJetpackCommand,
} from './cli.ts';
import {
	connect,
	disconnect,
	disconnectSite,
	disconnectUser,
	isSiteConnected,
	isUserConnected,
} from './connection.ts';
import { activateModule, deactivateModule, isModuleActive } from './jetpack.ts';
import { authenticateUser } from './login.ts';

export {
	connect,
	saveJetpackPrivateOptionsToStorageState,
	disconnectUser,
	disconnectSite,
	disconnect,
	isUserConnected,
	isSiteConnected,
} from './connection-utils.ts';

class TestUtils {
	requestUtils: RequestUtils;

	constructor( requestUtils: RequestUtils ) {
		this.requestUtils = requestUtils;
	}

	// Authentication utilities
	authenticateUser: typeof authenticateUser = authenticateUser.bind( this );

	// Connection utilities
	isUserConnected: typeof isUserConnected = isUserConnected.bind( this );
	isSiteConnected: typeof isSiteConnected = isSiteConnected.bind( this );
	connect: typeof connect = connect.bind( this );
	disconnectUser: typeof disconnectUser = disconnectUser.bind( this );
	disconnectSite: typeof disconnectSite = disconnectSite.bind( this );
	disconnect: typeof disconnect = disconnect.bind( this );

	// CLI utilities
	executeCommand: typeof executeCommand = executeCommand;
	executeWpCommand: typeof executeWpCommand = executeWpCommand;
	executeJetpackCommand: typeof executeJetpackCommand = executeJetpackCommand;
	executeContainerCommand: typeof executeContainerCommand = executeContainerCommand;

	// Jetpack specific utilities
	activateModule: typeof activateModule = activateModule;
	deactivateModule: typeof deactivateModule = deactivateModule;
	isModuleActive: typeof isModuleActive = isModuleActive;
}

export { TestUtils };
