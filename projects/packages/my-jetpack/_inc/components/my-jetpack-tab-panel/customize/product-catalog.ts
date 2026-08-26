import type { AdminMenuItem } from './types';

export type MenuCatalogProduct = {
	slug: string;
	status?: ProductStatus;
};

export type MenuCatalogModule = {
	activated?: boolean;
	available?: boolean;
};

const INACTIVE_PRODUCT_STATUSES = new Set< ProductStatus >( [
	'inactive',
	'module_disabled',
	'plugin_absent',
	'plugin_absent_with_plan',
	'needs_plan',
	'needs_activation',
	'needs_first_site_connection',
] );

const PRODUCT_MODULE_SLUGS: Record< string, string > = {
	backup: 'vaultpress',
	'jetpack-ai': 'ai',
	'jetpack-forms': 'contact-form',
	social: 'publicize',
};

export const getMenuProductModuleSlug = ( productSlug: string ) =>
	PRODUCT_MODULE_SLUGS[ productSlug ] ?? productSlug;

const isProductActive = (
	item: AdminMenuItem,
	products: Record< string, MenuCatalogProduct >,
	modules: Record< string, MenuCatalogModule >,
	optimisticActiveIds: ReadonlySet< string >
) => {
	if ( optimisticActiveIds.has( item.id ) ) {
		return true;
	}
	if ( ! item.productSlug ) {
		return item.registered;
	}
	if ( ! item.registered ) {
		return false;
	}

	const moduleSlug = getMenuProductModuleSlug( item.productSlug );
	const module = modules[ moduleSlug ];
	if ( typeof module?.activated === 'boolean' ) {
		return module.activated;
	}

	const product = products[ item.productSlug ];
	if ( ! product?.status ) {
		return item.registered;
	}

	return ! INACTIVE_PRODUCT_STATUSES.has( product.status );
};

/**
 * Split menu destinations into the real active menu and inactive product discovery rows.
 *
 * @param items               - Complete menu catalog.
 * @param products            - Current My Jetpack product states by product slug.
 * @param modules             - Current Jetpack module states by module slug.
 * @param optimisticActiveIds - Products activated before the status query refreshes.
 * @return Active menu items and alphabetized inactive products.
 */
export function getMenuCatalogState(
	items: AdminMenuItem[],
	products: Record< string, MenuCatalogProduct > = {},
	modules: Record< string, MenuCatalogModule > = {},
	optimisticActiveIds: ReadonlySet< string > = new Set()
) {
	const activeItems: AdminMenuItem[] = [];
	const inactiveItems: AdminMenuItem[] = [];

	items.forEach( item => {
		if ( isProductActive( item, products, modules, optimisticActiveIds ) ) {
			activeItems.push( item );
		} else if ( item.productSlug ) {
			inactiveItems.push( item );
		}
	} );

	inactiveItems.sort( ( a, b ) => a.label.localeCompare( b.label ) );

	return { activeItems, inactiveItems };
}

/**
 * Optimistically mark a catalog product as active for the current editor session.
 *
 * @param items - Current complete catalog.
 * @param item  - Product that was activated.
 * @return Updated catalog without duplicate IDs.
 */
export function insertActivatedItem( items: AdminMenuItem[], item: AdminMenuItem ) {
	const activatedItem = {
		...item,
		registered: true,
		newlyActivated: ! item.hasSavedOrder,
	};
	const existingIndex = items.findIndex( candidate => candidate.id === item.id );

	if ( existingIndex < 0 ) {
		return [ ...items, activatedItem ];
	}

	return items.map( ( candidate, index ) =>
		index === existingIndex ? activatedItem : candidate
	);
}
