import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { resolveFeatureState } from '../../components/my-jetpack-tab-panel/features/feature-state';
import { getProductModules } from '../../components/my-jetpack-tab-panel/features/mappings';
import { getMyJetpackSections } from '../../components/my-jetpack-tab-panel/utils';
import { PRODUCT_STATUSES } from '../../constants';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { prepareProductData } from '../../data/utils/prepare-product-data';
import { isJetpackPluginActive } from '../../utils/is-jetpack-plugin-active';
import type { MyJetpackModule } from '../../types';

/**
 * One place the header's launcher can take you, as plain data for a dropdown or the command palette.
 */
export type LauncherDestination = {
	id: string;
	label: string;
	url: string;
	/** Extra words a search should match, besides the label. */
	keywords: string[];
	type: 'feature' | 'page' | 'settings';
};

/**
 * The active features that have a page, in the Features tab's order.
 *
 * Resolved by the Features tab's own rule from the page's initial state, so the two agree
 * without a request.
 *
 * @return The feature destinations.
 */
function getFeatureDestinations(): LauncherDestination[] {
	const state = getMyJetpackWindowInitialState();
	const mainFeatures = state?.mainFeatures;

	// Absent from a plugin carrying an older copy of this package.
	if ( ! mainFeatures || ! Array.isArray( mainFeatures.features ) ) {
		return [];
	}

	const items = state.products?.items ?? {};
	// Only an active module's state is known here, which is all an "is it on" answer needs.
	const modules = Object.fromEntries(
		( state.header?.activeModules ?? [] ).map( module => [
			module,
			{ module, available: true, activated: true } as MyJetpackModule,
		] )
	);
	const productModules = getProductModules();
	const activated = new Set( state.header?.activatedProducts ?? [] );

	/**
	 * A feature's product as the Features tab expects it.
	 *
	 * @param slug - The product slug.
	 * @return The product, or undefined when the site has none by that slug.
	 */
	const getProduct = ( slug: string ) => {
		if ( ! items[ slug ] ) {
			return undefined;
		}

		const product = prepareProductData( items[ slug ] );

		// Mark a product active when the sidebar's test says it's on, since the page state has no statuses.
		return activated.has( slug ) ? { ...product, status: PRODUCT_STATUSES.ACTIVE } : product;
	};

	return mainFeatures.features
		.filter( feature => feature.manage_url )
		.filter(
			feature =>
				resolveFeatureState(
					feature,
					mainFeatures.jetpack,
					getProduct( feature.product ),
					modules,
					productModules
				).status === 'active'
		)
		.map( feature => ( {
			id: feature.slug,
			label: feature.name,
			url: feature.manage_url,
			keywords: [
				...new Set(
					[ feature.slug, feature.product, feature.module, feature.plugin_name ].filter(
						keyword => keyword && keyword !== feature.name
					)
				),
			],
			type: 'feature' as const,
		} ) );
}

/**
 * My Jetpack's own sections, as the tab panel offers them to this user and site.
 *
 * @return The page destinations.
 */
function getPageDestinations(): LauncherDestination[] {
	const keywords: Record< string, string[] > = {
		overview: [ __( 'dashboard', 'jetpack-my-jetpack' ), 'My Jetpack' ],
		features: [
			__( 'all features', 'jetpack-my-jetpack' ),
			__( 'products', 'jetpack-my-jetpack' ),
		],
		products: [
			__( 'all features', 'jetpack-my-jetpack' ),
			__( 'products', 'jetpack-my-jetpack' ),
		],
		help: [ __( 'support', 'jetpack-my-jetpack' ), __( 'documentation', 'jetpack-my-jetpack' ) ],
	};

	return getMyJetpackSections().map( section => ( {
		id: section.name,
		label: String( section.title ),
		url: getMyJetpackUrl( `#/${ section.name }` ),
		keywords: keywords[ section.name ] ?? [],
		type: 'page' as const,
	} ) );
}

/**
 * Every launcher destination: active features with a page, then My Jetpack's pages, then
 * Jetpack's settings where the Jetpack plugin provides them.
 *
 * @return The destinations, in display order.
 */
export function getLauncherDestinations(): LauncherDestination[] {
	const destinations = [ ...getFeatureDestinations(), ...getPageDestinations() ];

	// Standalone plugins have no Jetpack settings screen.
	if ( isJetpackPluginActive() ) {
		destinations.push( {
			id: 'jetpack-settings',
			label: __( 'Jetpack settings', 'jetpack-my-jetpack' ),
			url: getJetpackAdminPageUrl( '#/settings' ),
			keywords: [ __( 'modules', 'jetpack-my-jetpack' ) ],
			type: 'settings',
		} );
	}

	return destinations;
}

/**
 * The destinations whose label or keywords contain the query, ignoring case.
 *
 * @param destinations - The destinations to search.
 * @param query        - What the user typed.
 * @return The matches, in their original order; all of them for a blank query.
 */
export function filterLauncherDestinations(
	destinations: LauncherDestination[],
	query: string
): LauncherDestination[] {
	const needle = query.trim().toLocaleLowerCase();

	if ( ! needle ) {
		return destinations;
	}

	return destinations.filter( ( { label, keywords } ) =>
		[ label, ...keywords ].some( text => text.toLocaleLowerCase().includes( needle ) )
	);
}

/**
 * The launcher's destinations, read once from the page's initial state.
 *
 * @return The destinations, in display order.
 */
export function useLauncherDestinations(): LauncherDestination[] {
	return useMemo( getLauncherDestinations, [] );
}
