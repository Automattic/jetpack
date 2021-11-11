import { test, expect } from '@playwright/test';
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';

let jetpackBoostPage;

const modules = [
	// ['MODULE_NAME', 'DEFAULT STATE'],
	[ 'critical-css', 'disabled' ],
	[ 'lazy-images', 'enabled' ],
	[ 'render-blocking-js', 'disabled' ],
];

test.describe( 'Modules', () => {
	test.beforeAll( async () => {
		await boostPrerequisitesBuilder()
			.withInactiveModules( [ 'critical-css', 'render-blocking-js' ] )
			.build();
		await boostPrerequisitesBuilder().withActiveModules( [ 'lazy-images' ] ).build();
	} );

	test.beforeEach( async ( { page } ) => {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	modules.forEach( ( [ moduleSlug, moduleState ] = module ) => {
		test( `The ${ moduleSlug } module should be ${ moduleState } by default`, async () => {
			let isModuleEnabled = false;
			if ( moduleState === 'enabled' ) {
				isModuleEnabled = true;
			}
			expect( await jetpackBoostPage.isModuleEnabled( moduleSlug ) ).toEqual( isModuleEnabled );
		} );

		test( `The ${ moduleSlug } module state should toggle to an inverse state`, async () => {
			let isModuleEnabled = true;
			if ( moduleState === 'enabled' ) {
				isModuleEnabled = false;
			}
			await jetpackBoostPage.toggleModule( moduleSlug );
			await jetpackBoostPage.waitForApiResponse( `${ moduleSlug }-status` );
			expect( await jetpackBoostPage.isModuleEnabled( moduleSlug ) ).toEqual( isModuleEnabled );
		} );

		test( `The ${ moduleSlug } module state should revert back to original state`, async () => {
			let isModuleEnabled = false;
			if ( moduleState === 'enabled' ) {
				isModuleEnabled = true;
			}
			await jetpackBoostPage.toggleModule( moduleSlug );
			await jetpackBoostPage.waitForApiResponse( `${ moduleSlug }-status` );
			expect( await jetpackBoostPage.isModuleEnabled( moduleSlug ) ).toEqual( isModuleEnabled );
		} );
	} );
} );
