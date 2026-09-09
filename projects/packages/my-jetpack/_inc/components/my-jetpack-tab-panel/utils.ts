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
 * Sections reachable by URL, including any hidden from the tab bar.
 *
 * @return Every valid section name.
 */
export function getAllMyJetpackSections(): string[] {
	return [
		MY_JETPACK_SECTION_OVERVIEW,
		MY_JETPACK_SECTION_PRODUCTS,
		MY_JETPACK_SECTION_FEATURES,
		MY_JETPACK_SECTION_HELP,
	];
}

/**
 * Get the My Jetpack sections.
 *
 * Products is deliberately absent: it stays reachable at `#/products` for comparison,
 * but is no longer somewhere the tab bar will take you.
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
			name: MY_JETPACK_SECTION_FEATURES,
			title: __( 'Features', 'jetpack-my-jetpack' ),
		},
		{
			name: MY_JETPACK_SECTION_HELP,
			title: __( 'Help', 'jetpack-my-jetpack' ),
		},
	];
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
	return getAllMyJetpackSections().includes( section );
}
