import { SectionTabs } from '@jetpack-premium-analytics/ui';
import { useMemo } from 'react';
import styles from './dashboard-sections.module.scss';
import type { DashboardSection, DashboardSectionId } from '../../config';
import type { ReactNode, Ref } from 'react';

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

	/**
	 * Receives the tab list wrapper, for the onboarding tour.
	 */
	tabListRef?: Ref< HTMLDivElement >;
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
	tabListRef,
}: DashboardSectionsProps ) {
	const tabs = useMemo(
		() => sections.map( ( { slug, label } ) => ( { id: slug, label } ) ),
		[ sections ]
	);

	return (
		<SectionTabs
			tabs={ tabs }
			value={ value }
			onChange={ onChange }
			rootClassName={ styles.root }
			tabListRef={ tabListRef }
		>
			{ children }
		</SectionTabs>
	);
}
