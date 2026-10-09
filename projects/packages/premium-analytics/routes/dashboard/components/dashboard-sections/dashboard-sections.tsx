import { SectionTabs } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { SETTINGS_SECTION } from '../../config';
import styles from './dashboard-sections.module.scss';
import type { DashboardSection, DashboardSectionId } from '../../config';
import type { ReactNode } from 'react';

type DashboardSectionsProps = {
	/**
	 * The sections to render, in order.
	 */
	sections: DashboardSection[];

	/**
	 * Whether to end the tab bar with the Settings tab.
	 */
	withSettingsTab?: boolean;

	/**
	 * Whether the Settings tab is shown but cannot be selected.
	 */
	isSettingsTabDisabled?: boolean;

	/**
	 * The currently active section ID.
	 */
	value: DashboardSectionId;

	/**
	 * Called with the new section ID when the user selects a different section.
	 */
	onChange: ( id: DashboardSectionId ) => void;

	/**
	 * Section panel content.
	 */
	children?: ReactNode;
};

/**
 * The analytics dashboard section tab bar.
 *
 * Purely presentational: it renders the section tab triggers and reports selection
 * changes upward. Panel children are rendered inside the same Tabs.Root so the
 * tablist and section content share a complete tab/panel relationship.
 *
 * Tabs are keyed by the section `slug` (the URL-facing identifier the active
 * section state uses), not the namespaced `id`. The Settings tab is not a
 * registered section, so another plugin cannot place a section after it.
 *
 * @param {DashboardSectionsProps} props - The props for the DashboardSections component.
 * @return The section tab bar element.
 */
export function DashboardSections( {
	sections,
	withSettingsTab = false,
	isSettingsTabDisabled = false,
	value,
	onChange,
	children,
}: DashboardSectionsProps ) {
	const tabs = useMemo(
		() => [
			...sections.map( ( { slug, label } ) => ( { id: slug, label } ) ),
			...( withSettingsTab
				? [
						{
							id: SETTINGS_SECTION,
							label: __( 'Settings', 'jetpack-premium-analytics-pkg' ),
							disabled: isSettingsTabDisabled,
						},
					]
				: [] ),
		],
		[ sections, withSettingsTab, isSettingsTabDisabled ]
	);

	return (
		<SectionTabs tabs={ tabs } value={ value } onChange={ onChange } rootClassName={ styles.root }>
			{ children }
		</SectionTabs>
	);
}
