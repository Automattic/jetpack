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
 * @return The sections for the My Jetpack tab panel.
 */
export function getMyJetpackSections(): TabPanelProps[ 'tabs' ] {
	const showAdminTab = currentUserCan( 'manage_options' );

	const tabs = [
		{
			name: MY_JETPACK_SECTION_OVERVIEW,
			title: __( 'Overview', 'jetpack-my-jetpack' ),
		},
		{
			name: MY_JETPACK_SECTION_PRODUCTS,
			title: __( 'Products', 'jetpack-my-jetpack' ),
			isAdminOnly: true,
		},
		{
			name: MY_JETPACK_SECTION_HELP,
			title: __( 'Help', 'jetpack-my-jetpack' ),
		},
	];

	return tabs.filter( tab => ! ( tab.isAdminOnly && ! showAdminTab ) );
}

/**
 * Check if the given section is a valid My Jetpack section.
 *
 * @param section - The section to check.
 * @return True if the section is valid, false otherwise.
 */
export function isValidMyJetpackSection( section: string ) {
	return getMyJetpackSections().some( item => item.name === section );
}
