import {
	syncVideoPressWpAdminMenu,
	syncVideoPressWpAdminMenuForProductResponse,
} from '../sync-wp-admin-menu';
import type { ProductCamelCase, ProductSnakeCase } from '../../data/types';

const videoPressProduct = {
	featureIdentifyingPaidPlan: 'videopress',
} as ProductCamelCase;

const videoPressProductResponse = {
	videopress: {
		feature_identifying_paid_plan: 'videopress',
	} as ProductSnakeCase,
};

const boostProductResponse = {
	boost: {
		feature_identifying_paid_plan: 'cloud-critical-css',
	} as ProductSnakeCase,
};

const setJetpackSubmenu = ( items: Array< { label: string; href: string } > ) => {
	document.body.innerHTML = `
		<ul id="adminmenu">
			<li id="toplevel_page_jetpack">
				<ul class="wp-submenu">
					<li class="wp-submenu-head" aria-hidden="true">Jetpack</li>
					${ items.map( item => `<li><a href="${ item.href }">${ item.label }</a></li>` ).join( '' ) }
				</ul>
			</li>
		</ul>
	`;
};

const getSubmenuLinks = () => {
	return Array.from(
		document.querySelectorAll< HTMLAnchorElement >(
			'#toplevel_page_jetpack .wp-submenu li:not(.wp-submenu-head) a'
		)
	);
};

const getSubmenuLabels = () => {
	return getSubmenuLinks().map( link => link.textContent );
};

const getVideoPressLinks = () => {
	return getSubmenuLinks().filter( link => link.href.includes( 'page=jetpack-videopress' ) );
};

const setJetpackAdminMenuData = (
	items: Window[ 'myJetpackInitialState' ][ 'jetpackAdminMenu' ][ 'items' ]
) => {
	window.myJetpackInitialState = {
		adminUrl: 'https://example.com/wp-admin',
		jetpackAdminMenu: {
			items,
			videoPressMenuItem: {
				menuSlug: 'jetpack-videopress',
				menuTitle: 'VideoPress',
				position: 3,
			},
		},
	} as Window[ 'myJetpackInitialState' ];
};

describe( 'syncVideoPressWpAdminMenu', () => {
	const originalInitialState = window.myJetpackInitialState;

	beforeEach( () => {
		setJetpackAdminMenuData( [] );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
		window.myJetpackInitialState = originalInitialState;
	} );

	it( 'adds VideoPress at the same relative position as the PHP admin menu', () => {
		setJetpackSubmenu( [
			{ label: 'My Jetpack', href: 'https://example.com/wp-admin/admin.php?page=my-jetpack' },
			{ label: 'Dashboard', href: 'https://example.com/wp-admin/admin.php?page=jetpack' },
			{ label: 'Boost', href: 'https://example.com/wp-admin/admin.php?page=jetpack-boost' },
			{ label: 'SEO', href: 'https://example.com/wp-admin/admin.php?page=jetpack-seo' },
			{ label: 'AI', href: 'https://example.com/wp-admin/admin.php?page=jetpack-ai' },
			{ label: 'Social', href: 'https://example.com/wp-admin/admin.php?page=jetpack-social' },
			{ label: 'Backup', href: 'https://example.com/wp-admin/admin.php?page=jetpack-backup' },
			{ label: 'Settings', href: 'https://example.com/wp-admin/admin.php?page=jetpack#/settings' },
		] );
		setJetpackAdminMenuData( [
			{ menuSlug: 'my-jetpack', menuTitle: 'My Jetpack', position: -1 },
			{ menuSlug: 'jetpack-boost', menuTitle: 'Boost', position: 2 },
			{ menuSlug: 'jetpack-seo', menuTitle: 'SEO', position: 2 },
			{ menuSlug: 'jetpack-ai', menuTitle: 'AI', position: 4 },
			{ menuSlug: 'jetpack-social', menuTitle: 'Social', position: 4 },
			{ menuSlug: 'jetpack-backup', menuTitle: 'Backup', position: 7 },
			{ menuSlug: 'jetpack#/settings', menuTitle: 'Settings', position: 13 },
		] );

		syncVideoPressWpAdminMenuForProductResponse( videoPressProductResponse, true );

		expect( getSubmenuLabels() ).toEqual( [
			'My Jetpack',
			'Dashboard',
			'Boost',
			'SEO',
			'VideoPress',
			'AI',
			'Social',
			'Backup',
			'Settings',
		] );
		expect( getVideoPressLinks()[ 0 ] ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=jetpack-videopress'
		);
	} );

	it( 'deduplicates and repositions an existing VideoPress item', () => {
		setJetpackSubmenu( [
			{ label: 'Boost', href: 'https://example.com/wp-admin/admin.php?page=jetpack-boost' },
			{ label: 'Settings', href: 'https://example.com/wp-admin/admin.php?page=jetpack#/settings' },
			{
				label: 'VideoPress',
				href: 'https://example.com/wp-admin/admin.php?page=jetpack-videopress',
			},
			{
				label: 'VideoPress',
				href: 'https://example.com/wp-admin/admin.php?page=jetpack-videopress',
			},
		] );
		setJetpackAdminMenuData( [
			{ menuSlug: 'jetpack-boost', menuTitle: 'Boost', position: 2 },
			{ menuSlug: 'jetpack#/settings', menuTitle: 'Settings', position: 13 },
		] );

		syncVideoPressWpAdminMenu( videoPressProduct, true );

		expect( getSubmenuLabels() ).toEqual( [ 'Boost', 'VideoPress', 'Settings' ] );
		expect( getVideoPressLinks() ).toHaveLength( 1 );
	} );

	it( 'removes VideoPress when the product is deactivated', () => {
		setJetpackSubmenu( [
			{ label: 'Boost', href: 'https://example.com/wp-admin/admin.php?page=jetpack-boost' },
			{
				label: 'VideoPress',
				href: 'https://example.com/wp-admin/admin.php?page=jetpack-videopress',
			},
			{ label: 'AI', href: 'https://example.com/wp-admin/admin.php?page=jetpack-ai' },
		] );

		syncVideoPressWpAdminMenuForProductResponse( videoPressProductResponse, false );

		expect( getSubmenuLabels() ).toEqual( [ 'Boost', 'AI' ] );
		expect( getVideoPressLinks() ).toHaveLength( 0 );
	} );

	it( 'ignores unrelated products and missing admin menus', () => {
		setJetpackSubmenu( [
			{ label: 'Boost', href: 'https://example.com/wp-admin/admin.php?page=jetpack-boost' },
		] );

		syncVideoPressWpAdminMenuForProductResponse( boostProductResponse, true );

		expect( getSubmenuLabels() ).toEqual( [ 'Boost' ] );

		document.body.innerHTML = '';

		expect( () =>
			syncVideoPressWpAdminMenuForProductResponse( videoPressProductResponse, true )
		).not.toThrow();
	} );
} );
