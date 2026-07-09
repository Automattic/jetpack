import { Tabs } from '@wordpress/ui';
import { useCallback } from 'react';
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
 * @param props          - Component props.
 * @param props.sections - The sections to render, in order.
 * @param props.value    - The currently active section ID.
 * @param props.onChange - Called with the new section ID when the user selects a different section.
 * @param props.children - Section panel content.
 * @return The section tab bar element.
 */
export function DashboardSections( {
	sections,
	value,
	onChange,
	children,
}: DashboardSectionsProps ) {
	// Hoisted so it isn't an inline arrow in JSX (react/jsx-no-bind is an error).
	const handleValueChange = useCallback(
		( sectionId: string ) => onChange( sectionId as DashboardSectionId ),
		[ onChange ]
	);

	return (
		<Tabs.Root value={ value } onValueChange={ handleValueChange } className={ styles.root }>
			<div className={ styles.tabList }>
				<Tabs.List variant="minimal">
					{ sections.map( section => (
						<Tabs.Tab key={ section.id } value={ section.id }>
							{ section.label }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			</div>
			{ children }
		</Tabs.Root>
	);
}
