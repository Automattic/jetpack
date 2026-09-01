import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import {
	executeCommand,
	executeContainerCommand,
	executeWpCommand,
	executeJetpackCommand,
	executeWpDbQuery,
} from './cli';
import {
	connect,
	disconnect,
	disconnectSite,
	disconnectUser,
	isSiteConnected,
	isUserConnected,
} from './connection';
import {
	getConfigTestSite,
	getDotComCredentials,
	getSiteCredentials,
	isLocalSite,
	resetEnvironment,
	resolveSiteUrl,
} from './environment';
import { activateModule, deactivateModule, isModuleActive } from './jetpack';
import { authenticateUser } from './login';
import { setMockPlanData } from './plan';
import { createUser, deleteUser } from './user';

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
	executeWpDbQuery: typeof executeWpDbQuery = executeWpDbQuery;

	// Jetpack specific utilities
	activateModule: typeof activateModule = activateModule;
	deactivateModule: typeof deactivateModule = deactivateModule;
	isModuleActive: typeof isModuleActive = isModuleActive;

	// Plan utilities
	setMockPlanData: typeof setMockPlanData = setMockPlanData.bind( this );

	// Environment utilities
	getConfigTestSite: typeof getConfigTestSite = getConfigTestSite;
	resolveSiteUrl: typeof resolveSiteUrl = resolveSiteUrl;
	isLocalSite: typeof isLocalSite = isLocalSite;
	getSiteCredentials: typeof getSiteCredentials = getSiteCredentials;
	getDotComCredentials: typeof getDotComCredentials = getDotComCredentials;
	resetEnvironment: typeof resetEnvironment = resetEnvironment;

	// user utilities
	createUser: typeof createUser = createUser;
	deleteUser: typeof deleteUser = deleteUser;
}

export { TestUtils };
