import { TabPanelProps } from '@wordpress/components/build-types/tab-panel/types';
import { __ } from '@wordpress/i18n';
import { MY_JETPACK_TAB_HELP, MY_JETPACK_TAB_OVERVIEW, MY_JETPACK_TAB_PRODUCTS } from './constants';

/**
 * Get the My Jetpack tabs.
 *
 * @return The tabs for the My Jetpack tab panel.
 */
export function getMyJetpackTabs(): TabPanelProps[ 'tabs' ] {
	return [
		{
			name: MY_JETPACK_TAB_OVERVIEW,
			title: __( 'Overview', 'jetpack-my-jetpack' ),
		},
		{
			name: MY_JETPACK_TAB_PRODUCTS,
			title: __( 'Products', 'jetpack-my-jetpack' ),
		},
		{
			name: MY_JETPACK_TAB_HELP,
			title: __( 'Help', 'jetpack-my-jetpack' ),
		},
	];
}

/**
 * Check if the given section is a valid My Jetpack section.
 *
 * @param section - The section to check.
 * @return True if the section is valid, false otherwise.
 */
export function isValidMyJetpackSection( section: string ) {
	return getMyJetpackTabs().some( tab => tab.name === section );
}
