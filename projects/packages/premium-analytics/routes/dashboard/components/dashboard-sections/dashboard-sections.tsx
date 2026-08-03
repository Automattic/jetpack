import { SectionTabs } from '@jetpack-premium-analytics/ui';
import styles from './dashboard-sections.module.scss';
import type { DashboardSection, DashboardSectionId } from '../../config';
import type { ReactNode } from 'react';

type DashboardSectionsProps = {
	/**
	 * The sections to render, in order.
	 */
	sections: DashboardSection[];

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
 * section state uses), not the namespaced `id`.
 *
 * @param {DashboardSectionsProps} props - The props for the DashboardSections component.
 * @return The section tab bar element.
 */
export function DashboardSections( {
	sections,
	value,
	onChange,
	children,
}: DashboardSectionsProps ) {
	return (
		<SectionTabs
			tabs={ sections.map( ( { slug, label } ) => ( { id: slug, label } ) ) }
			value={ value }
			onChange={ onChange }
			rootClassName={ styles.root }
			className={ styles.tabList }
		>
			{ children }
		</SectionTabs>
	);
}
