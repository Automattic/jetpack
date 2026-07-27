import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import {
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_PRODUCTS,
} from './constants';
import type { TabPanel } from '@wordpress/components';
import type { ComponentProps } from 'react';

type TabPanelProps = ComponentProps< typeof TabPanel >;

/**
 * Get the My Jetpack sections.
 *
 * @return The sections for the My Jetpack tab panel.
 */
export function getMyJetpackSections(): TabPanelProps[ 'tabs' ] {
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

	// WordPress.com Simple sites only get the Products section.
	if ( isSimpleSite() ) {
		return tabs.filter( tab => tab.name === MY_JETPACK_SECTION_PRODUCTS );
	}

	if ( currentUserCan( 'manage_options' ) ) {
		return tabs;
	}

	// If the user is not an admin, remove the Products tab.
	return tabs.filter( tab => tab.name !== MY_JETPACK_SECTION_PRODUCTS );
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
export function isValidMyJetpackSection( section: string ) {
	return getMyJetpackSections().some( item => item.name === section );
}
