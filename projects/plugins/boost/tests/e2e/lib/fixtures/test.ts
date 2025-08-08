import { test as baseTest, expect } from '@fixtures/base-test';
import JetpackBoostPage from '@pages/jetpack-boost-page';
import { BoostUtils } from '@utils/index';

const test = baseTest.extend< { jetpackBoostPage: JetpackBoostPage }, { boostUtils: BoostUtils } >(
	{
		jetpackBoostPage: async ( { page }, use ) => {
			// eslint-disable-next-line react-hooks/rules-of-hooks
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
