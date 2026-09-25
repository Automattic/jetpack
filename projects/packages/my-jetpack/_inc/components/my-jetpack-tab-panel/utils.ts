import { currentUserCan, isSimpleSite } from '@automattic/jetpack-script-data';
import { __, sprintf } from '@wordpress/i18n';
import {
	MY_JETPACK_SECTION_FEATURES,
	MY_JETPACK_SECTION_HELP,
	MY_JETPACK_SECTION_OVERVIEW,
	MY_JETPACK_SECTION_LEGACY_PRODUCTS,
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
			name: MY_JETPACK_SECTION_FEATURES,
			title: __( 'Features', 'jetpack-my-jetpack' ),
		},
		{
			name: MY_JETPACK_SECTION_HELP,
			title: __( 'Help', 'jetpack-my-jetpack' ),
		},
	];

	// WordPress.com Simple sites only get the Features section.
	if ( isSimpleSite() ) {
		return tabs.filter( tab => tab.name === MY_JETPACK_SECTION_FEATURES );
	}

	if ( currentUserCan( 'manage_options' ) ) {
		return tabs;
	}

	// If the user is not an admin, remove the Features tab.
	return tabs.filter( tab => tab.name !== MY_JETPACK_SECTION_FEATURES );
}

/**
 * Resolve a URL section to the section to render.
 *
 * The retired `products` section resolves to Features, so saved links and older plugins still land.
 *
 * @param section - The section from the URL.
 * @return The resolved section, or the first available section when it is not valid.
 */
export function resolveMyJetpackSection( section?: string ) {
	const aliased =
		section === MY_JETPACK_SECTION_LEGACY_PRODUCTS ? MY_JETPACK_SECTION_FEATURES : section;
	const sections = getMyJetpackSections();

	return sections.some( item => item.name === aliased ) ? aliased : sections[ 0 ].name;
}

/**
 * The badge label for whether something is switched on.
 *
 * Both labels here and in getSwitchLabel() are bound before the branch: minification folds
 * `c ? __( a ) : __( b )` into one call with a ternary msgid, which the i18n check rejects.
 *
 * @param isActive - Whether the feature or module is running.
 * @return The translated label.
 */
export function getActivationStatusLabel( isActive: boolean ): string {
	const activeText = __( 'Active', 'jetpack-my-jetpack' );
	const inactiveText = __( 'Inactive', 'jetpack-my-jetpack' );

	return isActive ? activeText : inactiveText;
}

/**
 * The label for a control that switches a feature on or off.
 *
 * @param isOn - Whether the feature is currently on.
 * @param name - The feature's name.
 * @return The label for what the control will do.
 */
export function getSwitchLabel( isOn: boolean, name: string ): string {
	const deactivateLabel = sprintf(
		/* translators: %s is the feature name. */
		__( 'Deactivate %s', 'jetpack-my-jetpack' ),
		name
	);
	const activateLabel = sprintf(
		/* translators: %s is the feature name. */
		__( 'Activate %s', 'jetpack-my-jetpack' ),
		name
	);

	return isOn ? deactivateLabel : activateLabel;
}
