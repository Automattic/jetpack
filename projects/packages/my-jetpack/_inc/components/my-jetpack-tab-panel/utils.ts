import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
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
 * Whether the `my-jetpack-features-tab` flag swaps the Products tab for a Features tab.
 *
 * @return True when the Features tab replaces the Products tab.
 */
export function isFeaturesTabEnabled(): boolean {
	return !! getMyJetpackWindowInitialState( 'myJetpackFlags' )?.featuresTab;
}

/**
 * Get the name of the section that lists products: `features` or `products`.
 *
 * @return The section name.
 */
export function getProductsSection() {
	return isFeaturesTabEnabled() ? MY_JETPACK_SECTION_FEATURES : MY_JETPACK_SECTION_PRODUCTS;
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
			title: isFeaturesTabEnabled()
				? __( 'Features', 'jetpack-my-jetpack' )
				: __( 'Products', 'jetpack-my-jetpack' ),
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
 * Get the default My Jetpack section.
 *
 * @return The name of the first available section.
 */
export function getDefaultMyJetpackSection() {
	return getMyJetpackSections()[ 0 ].name;
}

/**
 * Check if the given section is a valid My Jetpack section.
 *
 * @param section - The section to check.
 * @return True if the section is valid, false otherwise.
 */
export function isValidMyJetpackSection( section?: string ) {
	return getMyJetpackSections().some( item => item.name === section );
}

/**
 * Resolve a URL section to the section to render.
 *
 * `products` and `features` alias each other, so links saved under either flag state keep working.
 *
 * @param section - The section from the URL.
 * @return The resolved section, or the default section when it is not valid.
 */
export function resolveMyJetpackSection( section?: string ) {
	const aliased =
		section === MY_JETPACK_SECTION_PRODUCTS || section === MY_JETPACK_SECTION_FEATURES
			? getProductsSection()
			: section;

	return isValidMyJetpackSection( aliased ) ? aliased : getDefaultMyJetpackSection();
}
