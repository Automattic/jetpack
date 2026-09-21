import { currentUserCan, getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import {
	MY_JETPACK_SECTION_FEATURES,
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_PRODUCTS,
} from './constants';
import type { TabPanel } from '@wordpress/components';
import type { ComponentProps } from 'react';

type TabPanelProps = ComponentProps< typeof TabPanel >;

/**
 * Get the name of the section that lists products: `features` when the flag swaps it in.
 *
 * @return The section name.
 */
export function getProductsSection() {
	return getScriptData()?.myJetpack?.productsSection?.slug ?? MY_JETPACK_SECTION_PRODUCTS;
}

/**
 * Get the title of the section that lists products.
 *
 * @return The section title.
 */
export function getProductsSectionTitle() {
	return (
		getScriptData()?.myJetpack?.productsSection?.label ?? __( 'Products', 'jetpack-my-jetpack' )
	);
}

/**
 * Get the router path of the section that lists products, for links and redirects.
 *
 * @param search - Optional query string, including the leading `?`.
 * @return The path, e.g. `/features?filter=included`.
 */
export function getProductsSectionPath( search = '' ) {
	return `/${ getProductsSection() }${ search }`;
}

/**
 * Get the My Jetpack sections.
 *
 * @return The sections for the My Jetpack tab panel.
 */
export function getMyJetpackSections(): TabPanelProps[ 'tabs' ] {
	const productsSection = getProductsSection();
	const tabs = [
		{
			name: MY_JETPACK_SECTION_OVERVIEW,
			title: __( 'Overview', 'jetpack-my-jetpack' ),
		},
		{
			name: productsSection,
			title: getProductsSectionTitle(),
		},
		{
			name: MY_JETPACK_SECTION_HELP,
			title: __( 'Help', 'jetpack-my-jetpack' ),
		},
	];

	// WordPress.com Simple sites only get the Products section.
	if ( isSimpleSite() ) {
		return tabs.filter( tab => tab.name === productsSection );
	}

	if ( currentUserCan( 'manage_options' ) ) {
		return tabs;
	}

	// If the user is not an admin, remove the Products tab.
	return tabs.filter( tab => tab.name !== productsSection );
}

/**
 * Resolve a URL section to the section to render.
 *
 * `products` and `features` alias each other, so links saved under either flag state keep working.
 *
 * @param section - The section from the URL.
 * @return The resolved section, or the first available section when it is not valid.
 */
export function resolveMyJetpackSection( section?: string ) {
	const aliased =
		section === MY_JETPACK_SECTION_PRODUCTS || section === MY_JETPACK_SECTION_FEATURES
			? getProductsSection()
			: section;
	const sections = getMyJetpackSections();

	return sections.some( item => item.name === aliased ) ? aliased : sections[ 0 ].name;
}
