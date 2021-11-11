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

	for ( const module in modules ) {
		test( `The ${ module } module should be %s by default`, async () => {
			let isModuleEnabled = false;
			if ( module[ 1 ] === 'enabled' ) {
				isModuleEnabled = true;
			}
			expect( await jetpackBoostPage.isModuleEnabled( module[ 0 ] ) ).toEqual( isModuleEnabled );
		} );

		test( `The ${ module } module state should toggle to an inverse state`, async () => {
			let isModuleEnabled = true;
			if ( module[ 1 ] === 'enabled' ) {
				isModuleEnabled = false;
			}
			await jetpackBoostPage.toggleModule( module[ 0 ] );
			await jetpackBoostPage.waitForApiResponse( `${ module[ 0 ] }-status` );
			expect( await jetpackBoostPage.isModuleEnabled( module[ 0 ] ) ).toEqual( isModuleEnabled );
		} );

		test( `The ${ module } module state should revert back to original state`, async () => {
			let isModuleEnabled = false;
			if ( module[ 1 ] === 'enabled' ) {
				isModuleEnabled = true;
			}
			await jetpackBoostPage.toggleModule( module[ 0 ] );
			await jetpackBoostPage.waitForApiResponse( `${ module[ 0 ] }-status` );
			expect( await jetpackBoostPage.isModuleEnabled( module[ 0 ] ) ).toEqual( isModuleEnabled );
		} );
	}
} );
