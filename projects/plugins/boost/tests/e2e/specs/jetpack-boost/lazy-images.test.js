/**
 * External dependencies
 */
import { prerequisitesBuilder } from 'jetpack-e2e-tests/lib/env/prerequisites';

/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';

const moduleName = 'lazy-images';
let jetpackBoostPage;

describe( 'Lazy Images module', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withLoggedIn( true ).withConnection( true ).build();
	} );

	beforeEach( async function () {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	it( 'should be enabled by default', async () => {
		expect( await jetpackBoostPage.isModuleEnabled( moduleName ) ).toBeTruthy();
	} );

	it( 'should allow disabling module', async () => {
		await jetpackBoostPage.toggleModule( moduleName );
		await jetpackBoostPage.waitForApiResponse( `${ moduleName }-status` );
		expect( await jetpackBoostPage.isModuleEnabled( moduleName ) ).toBeFalsy();
	} );

	it( 'should allow enabling module', async () => {
		await jetpackBoostPage.toggleModule( moduleName );
		await jetpackBoostPage.waitForApiResponse( `${ moduleName }-status` );
		expect( await jetpackBoostPage.isModuleEnabled( moduleName ) ).toBeTruthy();
	} );
} );
