/**
 * Shared Jest replacement for `@automattic/jetpack-script-data`.
 *
 * Grouped suites share one instance, so each sets in its own `beforeEach` what it reads.
 */
export const mockJetpackScriptData = {
	getScriptData: jest.fn(),
	getAdminUrl: jest.fn( ( path: string ) => `https://example.com/wp-admin/${ path }` ),
	isSimpleSite: jest.fn( () => false ),
	currentUserCan: jest.fn(),
};
