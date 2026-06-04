import type { ProductCamelCase, ProductSnakeCase } from '../data/types';

const VIDEOPRESS_PRODUCT_FEATURE = 'videopress';
const VIDEOPRESS_MENU_SLUG = 'jetpack-videopress';
const VIDEOPRESS_MENU_TITLE = 'VideoPress';
const VIDEOPRESS_MENU_POSITION = 3;
const JETPACK_SUBMENU_SELECTOR = '#toplevel_page_jetpack .wp-submenu';

type InitialState = Window[ 'myJetpackInitialState' ];
type JetpackAdminMenu = NonNullable< InitialState >[ 'jetpackAdminMenu' ];
type JetpackAdminMenuItem = JetpackAdminMenu[ 'items' ][ number ];
type ProductWithFeature = ProductCamelCase | ProductSnakeCase | undefined;

const matchesVideoPressFeatureIdentifier = ( product: ProductWithFeature ) => {
	if ( ! product ) {
		return false;
	}

	if ( 'featureIdentifyingPaidPlan' in product ) {
		return product.featureIdentifyingPaidPlan === VIDEOPRESS_PRODUCT_FEATURE;
	}

	return product.feature_identifying_paid_plan === VIDEOPRESS_PRODUCT_FEATURE;
};

const includesVideoPressFeatureIdentifier = ( products: ProductWithFeature[] ) => {
	return products.some( product => matchesVideoPressFeatureIdentifier( product ) );
};

const normalizeProducts = ( products: ProductWithFeature | ProductWithFeature[] ) => {
	return Array.isArray( products ) ? products : [ products ];
};

const shouldSyncVideoPressMenu = ( products: ProductWithFeature | ProductWithFeature[] ) => {
	return includesVideoPressFeatureIdentifier( normalizeProducts( products ) );
};

const getProductValues = < T extends ProductWithFeature >( products?: Record< string, T > ) => {
	return Object.values( products || {} );
};

const getAdminUrl = () => {
	const adminUrl = window.myJetpackInitialState?.adminUrl || '/wp-admin/';

	return adminUrl.endsWith( '/' ) ? adminUrl : `${ adminUrl }/`;
};

const getVideoPressMenuItem = (): JetpackAdminMenuItem => {
	return (
		window.myJetpackInitialState?.jetpackAdminMenu?.videoPressMenuItem || {
			menuSlug: VIDEOPRESS_MENU_SLUG,
			menuTitle: VIDEOPRESS_MENU_TITLE,
			position: VIDEOPRESS_MENU_POSITION,
		}
	);
};

const getVideoPressMenuUrl = () => {
	return `${ getAdminUrl() }admin.php?page=${ getVideoPressMenuItem().menuSlug }`;
};

const escapeRegExp = ( value: string ) => {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
};

const isUrlLikeMenuSlug = ( menuSlug: string ) => {
	return (
		menuSlug.startsWith( '/' ) ||
		menuSlug.includes( '://' ) ||
		menuSlug.includes( '?' ) ||
		menuSlug.includes( '#' )
	);
};

const itemMatchesSlug = ( href: string, slug: string ) => {
	const normalizedHref = href.replace( /&amp;/g, '&' );
	const normalizedSlug = slug.replace( /&amp;/g, '&' );

	if ( isUrlLikeMenuSlug( normalizedSlug ) ) {
		return normalizedHref === normalizedSlug || normalizedHref.includes( normalizedSlug );
	}

	return new RegExp( `[?&]page=${ escapeRegExp( normalizedSlug ) }(?:[#&]|$)` ).test(
		normalizedHref
	);
};

const findMenuItem = ( submenu: Element, menuSlug: string ) => {
	const links = submenu.querySelectorAll< HTMLAnchorElement >( 'li:not(.wp-submenu-head) a' );

	return Array.from( links ).find( link => {
		const href = link.href || link.getAttribute( 'href' ) || '';

		return itemMatchesSlug( href, menuSlug );
	} );
};

const removeVideoPressMenuItems = ( submenu: Element ) => {
	const links = submenu.querySelectorAll< HTMLAnchorElement >( 'li:not(.wp-submenu-head) a' );
	const { menuSlug } = getVideoPressMenuItem();

	links.forEach( link => {
		const href = link.href || link.getAttribute( 'href' ) || '';

		if ( itemMatchesSlug( href, menuSlug ) ) {
			link.closest( 'li' )?.remove();
		}
	} );
};

const compareMenuItems = ( a: JetpackAdminMenuItem, b: JetpackAdminMenuItem ) => {
	const positionResult = ( a.position || 0 ) - ( b.position || 0 );

	if ( positionResult !== 0 ) {
		return positionResult;
	}

	if ( a.menuTitle === b.menuTitle ) {
		return 0;
	}

	return a.menuTitle > b.menuTitle ? 1 : -1;
};

const getRegisteredMenuItems = () => {
	return window.myJetpackInitialState?.jetpackAdminMenu?.items || [];
};

const findInsertionPoint = ( submenu: Element ) => {
	const videoPressMenuItem = getVideoPressMenuItem();
	const laterMenuItems = getRegisteredMenuItems().filter(
		menuItem =>
			menuItem.menuSlug !== videoPressMenuItem.menuSlug &&
			compareMenuItems( menuItem, videoPressMenuItem ) > 0
	);

	for ( const menuItem of laterMenuItems ) {
		const link = findMenuItem( submenu, menuItem.menuSlug );

		if ( link ) {
			return link.closest( 'li' );
		}
	}

	return null;
};

const addVideoPressMenuItem = ( submenu: Element ) => {
	removeVideoPressMenuItems( submenu );

	const menuItem = document.createElement( 'li' );
	const link = document.createElement( 'a' );
	link.href = getVideoPressMenuUrl();
	link.textContent = getVideoPressMenuItem().menuTitle;
	menuItem.appendChild( link );

	const insertionPoint = findInsertionPoint( submenu );

	if ( insertionPoint ) {
		submenu.insertBefore( menuItem, insertionPoint );
		return;
	}

	submenu.appendChild( menuItem );
};

export const syncVideoPressWpAdminMenu = (
	products: ProductWithFeature | ProductWithFeature[],
	isActive: boolean
) => {
	if ( typeof window === 'undefined' || typeof document === 'undefined' ) {
		return;
	}

	if ( ! shouldSyncVideoPressMenu( products ) ) {
		return;
	}

	const submenu = document.querySelector( JETPACK_SUBMENU_SELECTOR );

	if ( ! submenu ) {
		return;
	}

	if ( ! isActive ) {
		removeVideoPressMenuItems( submenu );
		return;
	}

	addVideoPressMenuItem( submenu );
};

export const syncVideoPressWpAdminMenuForProductResponse = (
	products: Record< string, ProductSnakeCase > | undefined,
	isActive: boolean
) => {
	return syncVideoPressWpAdminMenu( getProductValues( products ), isActive );
};
