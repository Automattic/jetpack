/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env';

describe( 'Settings Page', () => {
	beforeEach( async () => {
		await boostPrerequisitesBuilder().withCleanEnv( true ).withConnection( false ).build();
	} );

	it( 'Should connect to WP.com on a fresh install without Jetpack plugin activated', async () => {
		await prerequisitesBuilder().withInactivePlugins( [ 'jetpack' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isFreshlyConnected() ).toEqual( true );
	} );

	// eslint-disable-next-line jest/no-commented-out-tests
	// it( 'Should connect to WP.com on a fresh install with Jetpack plugin activated', async () => {
	// 	await prerequisitesBuilder().withActivePlugins( [ 'jetpack' ] ).build();
	// 	const jetpackBoostPage = await JetpackBoostPage.visit( page );
	// 	expect( await jetpackBoostPage.isFreshlyConnected() ).toEqual( true );
	// } );

	it( 'Should connect to WP.com on a fresh install with Jetpack plugin activated and Jetpack already connected', async () => {
		await prerequisitesBuilder().withActivePlugins( [ 'jetpack' ] ).withConnection( true ).build();
		await boostPrerequisitesBuilder().withConnection( false ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );
		expect( await jetpackBoostPage.isFreshlyConnected() ).toEqual( true );
	} );
} );
