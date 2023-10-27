import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { activateModules } from 'jetpack-e2e-commons/env/index.js';

test.describe( 'Jetpack compatibility', () => {
	test.beforeAll( async () => {
		await prerequisitesBuilder().withActivePlugins( [ 'jetpack' ] ).build();
	} );

	test( 'The Jetpack lazy-image module can not be activated in Boost dashboard', async ( {
		page,
	} ) => {
		await prerequisitesBuilder( page ).withInactiveModules( [ 'lazy-images' ] ).build();
		await activateModules( [ 'lazy-images' ] );

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isModuleEnabled( 'lazy_images' ),
			'lazy_images module should be disabled'
		).toEqual( false );
	} );
} );
