/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites';

let jetpackBoostPage;

const modules = [
	// ['MODULE_NAME', 'DEFAULT STATE'],
	[ 'critical-css', 'disabled' ],
	[ 'lazy-images', 'enabled' ],
	[ 'render-blocking-js', 'disabled' ],
];

describe( 'Modules', () => {
	beforeAll( async () => {
		await boostPrerequisitesBuilder()
			.withInactiveModules( [ 'critical-css', 'render-blocking-js' ] )
			.build();
		await boostPrerequisitesBuilder().withActiveModules( [ 'lazy-images' ] ).build();
	} );

	beforeEach( async function () {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test.each( modules )(
		'The %s module should be %s by default',
		async ( moduleSlug, moduleState ) => {
			let isModuleEnabled = false;
			if ( moduleState === 'enabled' ) {
				isModuleEnabled = true;
			}
			expect( await jetpackBoostPage.isModuleEnabled( moduleSlug ) ).toEqual( isModuleEnabled );
		}
	);

	test.each( modules )(
		'The %s module state should toggle to an inverse state',
		async ( moduleSlug, moduleState ) => {
			let isModuleEnabled = true;
			if ( moduleState === 'enabled' ) {
				isModuleEnabled = false;
			}
			await jetpackBoostPage.toggleModule( moduleSlug );
			await jetpackBoostPage.waitForApiResponse( `${ moduleSlug }-status` );
			expect( await jetpackBoostPage.isModuleEnabled( moduleSlug ) ).toEqual( isModuleEnabled );
		}
	);

	test.each( modules )(
		'The %s module state should revert back to original state',
		async ( moduleSlug, moduleState ) => {
			let isModuleEnabled = false;
			if ( moduleState === 'enabled' ) {
				isModuleEnabled = true;
			}
			await jetpackBoostPage.toggleModule( moduleSlug );
			await jetpackBoostPage.waitForApiResponse( `${ moduleSlug }-status` );
			expect( await jetpackBoostPage.isModuleEnabled( moduleSlug ) ).toEqual( isModuleEnabled );
		}
	);
} );
