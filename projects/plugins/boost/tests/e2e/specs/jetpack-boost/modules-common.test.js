import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { test, expect } from '../../fixtures/base-test.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';

let jetpackBoostPage;

const modules = [
	// ['MODULE_NAME', 'DEFAULT STATE'],
	[ 'critical-css', 'disabled' ],
	[ 'lazy-images', 'disabled' ],
	[ 'render-blocking-js', 'disabled' ],
];

test.describe.serial( 'Modules', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage();

		await boostPrerequisitesBuilder( page )
			.withConnection( true )
			.withInactiveModules( [ 'critical-css', 'lazy-images', 'render-blocking-js' ] )
			.build();
	} );

	test.beforeEach( async () => {
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
