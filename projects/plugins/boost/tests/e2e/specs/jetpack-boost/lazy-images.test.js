/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites';

const moduleName = 'lazy-images';
let jetpackBoostPage;

describe( 'Lazy Images module', () => {
	beforeAll( async () => {
		await boostPrerequisitesBuilder().withActiveModules( [ moduleName ] ).build();
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
