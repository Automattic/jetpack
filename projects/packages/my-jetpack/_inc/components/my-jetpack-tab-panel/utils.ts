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
 * @return The sections for the My Jetpack tab panel.
 */
export function getMyJetpackSections(): TabPanelProps[ 'tabs' ] {
	return [
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
}

/**
 * Check if the given section is a valid My Jetpack section.
 *
 * @param section - The section to check.
 * @return True if the section is valid, false otherwise.
 */
export function isValidMyJetpackSection( section: string ) {
	return getMyJetpackSections().some( tab => tab.name === section );
}
