import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
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

	test( 'The Jetpack lazy-image module activation reflects in Boost dashboard', async ( {
		page,
	} ) => {
		await prerequisitesBuilder( page ).withInactiveModules( [ 'lazy-images' ] ).build();
		await activateModules( [ 'lazy-images' ] );

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isModuleEnabled( 'lazy-images' ),
			'lazy-images module should be enabled'
		).toEqual( true );
	} );

	test( 'The Jetpack lazy-image module deactivation reflects in Boost dashboard', async ( {
		page,
	} ) => {
		await prerequisitesBuilder( page ).withActiveModules( [ 'lazy-images' ] ).build();
		await deactivateModules( [ 'lazy-images' ] );

		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect(
			await jetpackBoostPage.isModuleEnabled( 'lazy-images' ),
			'lazy-images module should be disabled'
		).toEqual( false );
	} );

	test( 'The Boost lazy-image module activation reflects in Jetpack dashboard', async ( {
		page,
	} ) => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'lazy-images' ] ).build();
		await activateBoostModules( [ 'lazy-images' ] );

		const isActive = await isModuleActive( 'lazy-images' );
		expect( isActive, 'lazy-images module should be active' ).toBe( true );
	} );

	test( 'The Boost lazy-image module deactivation reflects in Jetpack dashboard', async ( {
		page,
	} ) => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lazy-images' ] ).build();
		await deactivateBoostModules( [ 'lazy-images' ] );

		const isActive = await isModuleActive( 'lazy-images' );
		expect( isActive, 'lazy-images module should not be active' ).toBe( false );
	} );

	test( 'Lazy Image Toggle should work in Boost after using Jetpack dashboard to toogle lazy images.', async ( {
		page,
	} ) => {
		const lazyImagesModule = 'lazy-images';
		await boostPrerequisitesBuilder( page )
			.withConnection( true )
			.withInactiveModules( [ lazyImagesModule ] )
			.build();

		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		await boostPrerequisitesBuilder( page ).build();
		await deactivateBoostModules( [ lazyImagesModule ] );

		// Turn on Lazy Images in Jetpack Boost via the UI
		await jetpackBoostPage.toggleModule( lazyImagesModule );

		// Turn off Lazy Images with Jetpack
		await deactivateModules( [ lazyImagesModule ] );

		// Turn on Lazy Images in Jetpack Boost via the UI
		await jetpackBoostPage.reload();
		await jetpackBoostPage.toggleModule( lazyImagesModule );

		await jetpackBoostPage.reload();
		const isActiveInBoost = await jetpackBoostPage.isModuleEnabled( lazyImagesModule );
		const isActiveInJetpack = await isModuleActive( lazyImagesModule );

		expect( isActiveInBoost, 'lazy-images module should be active in Jetpack Boost' ).toBe( true );
		expect( isActiveInJetpack, 'lazy-images module should be active in Jetpack' ).toBe( true );
	} );
} );
