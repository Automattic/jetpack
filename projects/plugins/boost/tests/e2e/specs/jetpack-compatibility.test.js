import { test, expect } from '../fixtures/base-test.js';
import { JetpackBoostPage } from '../lib/pages/index.js';
import { prerequisitesBuilder, isModuleActive } from 'jetpack-e2e-commons/env/prerequisites.js';
import { activateModules, deactivateModules } from 'jetpack-e2e-commons/env/index.js';
import {
	boostPrerequisitesBuilder,
	activateModules as activateBoostModules,
	deactivateModules as deactivateBoostModules,
} from '../lib/env/prerequisites.js';

test.describe( 'Jetpack compatibility', () => {
	test.beforeAll( async () => {
		await prerequisitesBuilder().withActivePlugins( [ 'jetpack' ] ).build();
	} );

	test.skip( 'The Jetpack lazy-image module activation reflects in Boost dashboard', async ( {
		page,
	} ) => {
		await prerequisitesBuilder( page ).withInactiveModules( [ 'lazy-images' ] ).build();
		await activateModules( [ 'lazy-images' ] );

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isModuleEnabled( 'lazy-images' ) ).toEqual( true );
	} );

	test.skip( 'The Jetpack lazy-image module deactivation reflects in Boost dashboard', async ( {
		page,
	} ) => {
		await prerequisitesBuilder( page ).withActiveModules( [ 'lazy-images' ] ).build();
		await deactivateModules( [ 'lazy-images' ] );

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isModuleEnabled( 'lazy-images' ) ).toEqual( false );
	} );

	test.skip( 'The Boost lazy-image module activation reflects in Jetpack dashboard', async ( {
		page,
	} ) => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'lazy-images' ] ).build();
		await activateBoostModules( [ 'lazy-images' ] );

		const isActive = await isModuleActive( 'lazy-images' );
		expect( isActive ).toBe( true );
	} );

	test.skip( 'The Boost lazy-image module deactivation reflects in Jetpack dashboard', async ( {
		page,
	} ) => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lazy-images' ] ).build();
		await deactivateBoostModules( [ 'lazy-images' ] );

		const isActive = await isModuleActive( 'lazy-images' );
		expect( isActive ).toBe( false );
	} );
} );
