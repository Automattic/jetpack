import {
	getJetpackCurrentMenuKey,
	getJetpackEffectiveRoute,
	getJetpackPageOrder,
} from '../jetpack-admin-menu';

const routes = {
	myJetpackRoutes: [ 'my-jetpack ' ],
	dashboardRoutes: [ '/', '/dashboard' ],
	recommendationsRoutes: [ '/recommendations' ],
	productDescriptionRoutes: [ '/anti-spam' ],
	settingsRoutes: [ '/settings' ],
};

describe( 'Jetpack admin menu helpers', () => {
	it( 'detects the known Jetpack submenu order', () => {
		const menu = document.createElement( 'ul' );
		menu.innerHTML = `
			<li><a href="/wp-admin/admin.php?page=jetpack#/dashboard">Dashboard</a></li>
			<li><a href="/wp-admin/admin.php?page=jetpack#/settings">Settings</a></li>
		`;

		const pageOrder = getJetpackPageOrder( menu.querySelectorAll( 'a' ) );

		expect( pageOrder.dashboard ).toBe( 1 );
		expect( pageOrder.settings ).toBe( 2 );
	} );

	it( 'keeps dashboard-like routes on the Dashboard submenu', () => {
		expect(
			getJetpackCurrentMenuKey( {
				hash: '#/dashboard',
				page: 'jetpack',
				...routes,
			} )
		).toBe( 'dashboard' );
		expect(
			getJetpackCurrentMenuKey( {
				hash: '#/recommendations',
				page: 'jetpack',
				...routes,
			} )
		).toBe( 'dashboard' );
	} );

	it( 'uses Offline Mode as the effective route for dashboard routes while offline', () => {
		expect(
			getJetpackEffectiveRoute( {
				route: '/',
				isOfflineMode: true,
				dashboardRoutes: routes.dashboardRoutes,
			} )
		).toBe( '/offline-mode' );

		expect(
			getJetpackEffectiveRoute( {
				route: '/dashboard',
				isOfflineMode: true,
				dashboardRoutes: routes.dashboardRoutes,
			} )
		).toBe( '/offline-mode' );
	} );

	it( 'keeps dashboard routes when Offline Mode is inactive', () => {
		expect(
			getJetpackEffectiveRoute( {
				route: '/',
				isOfflineMode: false,
				dashboardRoutes: routes.dashboardRoutes,
			} )
		).toBe( '/' );
	} );
} );
