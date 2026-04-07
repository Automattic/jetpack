/**
 * Playwright fixture for full-stack Boost E2E tests.
 *
 * Extends base-test from e2e-commons. The inherited beforeEach/afterEach hooks
 * (WPCOM request counting) target the e2e container — harmless overhead when
 * that container is running, which it typically is during local dev.
 *
 * Provides:
 * - fullStackUtils (worker-scoped): Docker, Redis, WP-CLI operations against dev container
 * - jetpackBoostPage (test-scoped): Boost admin page object
 */

import { test as baseTest, expect } from '_jetpack-e2e-commons/fixtures/base-test';
import JetpackBoostPage from '../pages/jetpack-boost-page';
import { FullStackUtils } from '../utils/full-stack-utils';

const test = baseTest.extend<
	{ jetpackBoostPage: JetpackBoostPage },
	{ fullStackUtils: FullStackUtils }
>( {
	jetpackBoostPage: async ( { page }, use ) => {
		await use( new JetpackBoostPage( page ) );
	},
	// Worker-scoped: one instance shared across all tests in a worker.
	// Full-stack specs must use test.describe.serial because the shared Docker
	// environment (dev WordPress, Redis, boost-cloud) cannot handle concurrent tests.
	fullStackUtils: [
		async ( {}, use ) => {
			await use( new FullStackUtils() );
		},
		{ scope: 'worker' },
	],
} );

// Capture Docker logs on test failure for post-mortem debugging in the Playwright HTML report.
test.afterEach( async ( { fullStackUtils }, testInfo ) => {
	if ( testInfo.status !== testInfo.expectedStatus ) {
		try {
			const logs = await fullStackUtils.captureDockerLogs();
			await testInfo.attach( 'docker-logs', {
				body: logs,
				contentType: 'text/plain',
			} );
		} catch {
			// Don't mask the real test failure
		}
	}
} );

export { test, expect };
