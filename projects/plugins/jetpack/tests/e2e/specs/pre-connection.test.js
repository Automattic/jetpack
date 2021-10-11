import {
	Sidebar,
	PluginsPage,
	DashboardPage,
	JetpackPage,
} from 'jetpack-e2e-commons/pages/wp-admin';
import { execWpCommand } from 'jetpack-e2e-commons/helpers';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env';

/**
 *
 * @group pre-connection
 */
describe( 'Jetpack pre-connection', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withCleanEnv().withLoggedIn( true ).build();
	} );

	beforeEach( async () => {
		await DashboardPage.visit( page );
	} );

	it( 'Can find connect button on plugins page', async () => {
		await ( await Sidebar.init( page ) ).selectInstalledPlugins();

		const pluginsPage = await PluginsPage.init( page );
		await execWpCommand( 'transient set activated_jetpack true 120' );
		await pluginsPage.reload();

		expect( await pluginsPage.isFullScreenPopupShown() ).toBeTruthy();
	} );

	it( 'Can find connect button on dashboard page', async () => {
		await ( await Sidebar.init( page ) ).selectDashboard();

		const dashboard = await DashboardPage.init( page );
		expect( await dashboard.isConnectBannerVisible() ).toBeTruthy();
	} );

	it( 'Can find connect button on Jetpack page', async () => {
		await ( await Sidebar.init( page ) ).selectJetpack();

		const jetpackPage = await JetpackPage.init( page );
		expect( await jetpackPage.isConnectScreenVisible() ).toBeTruthy();
	} );
} );
