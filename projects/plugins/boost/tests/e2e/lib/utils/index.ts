import { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';
import {
	executeJetpackBoostCommand,
	activateBoostModule,
	deactivateBoostModule,
	isConnected,
	connectIfNeeded,
	disconnect,
	unMockPremiumFeatures,
	mockPremiumFeatures,
	unMockSpeedScore,
	mockSpeedScore,
	createTestPosts,
	mockConnection,
	unMockConnection,
	resetEnvironment,
} from './boost-utils';

class BoostUtils extends TestUtils {
	executeJetpackBoostCommand: typeof executeJetpackBoostCommand = executeJetpackBoostCommand;
	activateBoostModule: typeof activateBoostModule = activateBoostModule;
	deactivateBoostModule: typeof deactivateBoostModule = deactivateBoostModule;
	isConnected: typeof isConnected = isConnected;
	connectIfNeeded: typeof connectIfNeeded = connectIfNeeded;
	disconnect: typeof disconnect = disconnect;
	mockSpeedScore: typeof mockSpeedScore = mockSpeedScore;
	unMockSpeedScore: typeof unMockSpeedScore = unMockSpeedScore;
	mockPremiumFeatures: typeof mockPremiumFeatures = mockPremiumFeatures;
	unMockPremiumFeatures: typeof unMockPremiumFeatures = unMockPremiumFeatures;
	createTestPosts: typeof createTestPosts = createTestPosts;
	mockConnection: typeof mockConnection = mockConnection;
	unMockConnection: typeof unMockConnection = unMockConnection;
	resetEnvironment: typeof resetEnvironment = resetEnvironment;
}

export { BoostUtils };
