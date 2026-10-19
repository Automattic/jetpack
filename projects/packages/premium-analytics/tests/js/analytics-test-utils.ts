/**
 * Shared Jest replacement for `@automattic/jetpack-analytics`.
 *
 * Grouped suites share one instance, so each clears it in its own `beforeEach`.
 */
export const mockJetpackAnalytics = {
	__esModule: true,
	default: {
		setUser: jest.fn(),
		identifyUser: jest.fn(),
		assignSuperProps: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
};
