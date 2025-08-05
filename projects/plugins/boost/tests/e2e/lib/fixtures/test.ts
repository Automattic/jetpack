/**
 * External dependencies
 */
import { test as baseTest, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
/**
 * Internal dependencies
 */
import JetpackBoostPage from '../pages/jetpack-boost-page.ts';

const test = baseTest.extend< { jetpackBoostPage: JetpackBoostPage } >( {
	jetpackBoostPage: async ( { page }, use ) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		await use( new JetpackBoostPage( page ) );
	},
} );

export { test, expect };
