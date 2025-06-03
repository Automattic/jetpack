import { currentUserCan } from '@automattic/jetpack-script-data';
import { TabPanelProps } from '@wordpress/components/build-types/tab-panel/types';
import { __ } from '@wordpress/i18n';
import {
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_PRODUCTS,
} from './constants';

/**
 * Get the My Jetpack sections.
 *
 * @param showProductsTab - Whether to show the products tab.
 * @return The sections for the My Jetpack tab panel.
 */
export function getMyJetpackSections( showProductsTab: boolean ): TabPanelProps[ 'tabs' ] {
	const showAdminTab = currentUserCan( 'manage_options' );

	const tabs = [
		{
			name: MY_JETPACK_SECTION_OVERVIEW,
			title: __( 'Overview', 'jetpack-my-jetpack' ),
		},
		{
			name: MY_JETPACK_SECTION_PRODUCTS,
			title: __( 'Products', 'jetpack-my-jetpack' ),
		},
		{
			name: MY_JETPACK_SECTION_HELP,
			title: __( 'Help', 'jetpack-my-jetpack' ),
		},
	];

	return [ tabs[ 0 ], ...( showProductsTab && showAdminTab ? [ tabs[ 1 ] ] : [] ), tabs[ 2 ] ];
}

/**
 * Check if the given section is a valid My Jetpack section.
 *
 * @param section         - The section to check.
 * @param showProductsTab - Whether to show the products tab.
 * @return True if the section is valid, false otherwise.
 */
export function isValidMyJetpackSection( section: string, showProductsTab: boolean ) {
	return getMyJetpackSections( showProductsTab ).some( item => item.name === section );
}
