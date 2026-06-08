import { test as baseTest, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import JetpackBoostPage from '../pages/jetpack-boost-page';
import { BoostUtils } from '../utils/index';

const test = baseTest.extend< { jetpackBoostPage: JetpackBoostPage }, { boostUtils: BoostUtils } >(
	{
		jetpackBoostPage: async ( { page }, use ) => {
			await use( new JetpackBoostPage( page ) );
		},
		boostUtils: [
			async ( { requestUtils }, use ) => {
				await use( new BoostUtils( requestUtils ) );
			},
			{ scope: 'worker' },
		],
	}
);

export { test, expect };
