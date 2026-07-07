import { Tabs } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './report-page-tabs.module.scss';
import type { ReactNode } from 'react';

/**
 * A resolved report-page tab ({ id, label }).
 */
export type ReportPageTab< TabId extends string = string > = {
	id: TabId;
	label: string;
};

export interface ReportPageTabsProps< TabId extends string = string > {
	/**
	 * The tabs to render, in order.
	 */
	tabs: ReportPageTab< TabId >[];

	/**
	 * The currently active tab ID.
	 */
	value: TabId;

	/**
	 * Called with the new tab ID when the user selects a different tab.
	 */
	onChange: ( id: TabId ) => void;

	/**
	 * Tab panel content.
	 */
	children?: ReactNode;

	/**
	 * Optional class applied to the tab list wrapper. This component does not
	 * own any horizontal page-gutter padding itself, so callers that render the
	 * tab bar full-bleed (e.g. outside a padded content container) supply it here.
	 */
	className?: string;
}

/**
 * The shared report-page tab bar.
 *
 * Purely presentational: it renders the tab triggers and reports selection
 * changes upward. Panel children render inside the same Tabs.Root so the
 * tablist and tab content share a complete tab/panel relationship.
 *
 * @param props           - Component props.
 * @param props.tabs      - The tabs to render, in order.
 * @param props.value     - The currently active tab ID.
 * @param props.onChange  - Called with the new tab ID when the user selects a different tab.
 * @param props.children  - Tab panel content.
 * @param props.className - Optional class applied to the tab list wrapper.
 * @return The tab bar element.
 */
export function ReportPageTabs< TabId extends string = string >( {
	tabs,
	value,
	onChange,
	children,
	className,
}: ReportPageTabsProps< TabId > ) {
	const handleValueChange = useCallback(
		( tabId: string ) => onChange( tabId as TabId ),
		[ onChange ]
	);

	return (
		<Tabs.Root value={ value } onValueChange={ handleValueChange }>
			<div className={ clsx( styles.tabList, className ) }>
				<Tabs.List variant="minimal">
					{ tabs.map( tab => (
						<Tabs.Tab key={ tab.id } value={ tab.id }>
							{ tab.label }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			</div>
			{ children }
		</Tabs.Root>
	);
}

export interface ReportPageTabPanelProps< TabId extends string = string > {
	/**
	 * The tab this panel belongs to.
	 */
	value: TabId;

	/**
	 * The panel content.
	 */
	children?: ReactNode;

	/**
	 * Optional class applied to the panel element.
	 */
	className?: string;
}

/**
 * A tab panel for `ReportPageTabs` children.
 *
 * Pages must use this instead of `Tabs.Panel` from `@wordpress/ui`: routes and
 * this toolkit each bundle their own copy of `@wordpress/ui`, and Base UI's
 * tabs context does not cross bundle copies — a `Tabs.Panel` imported by a
 * route cannot see the `Tabs.Root` this module renders. Exporting the panel
 * from the same module as the root guarantees both share one instance (the
 * same reason charts are re-exported through the toolkit).
 *
 * @param props           - Component props.
 * @param props.value     - The tab this panel belongs to.
 * @param props.children  - The panel content.
 * @param props.className - Optional class applied to the panel element.
 * @return The tab panel element.
 */
export function ReportPageTabPanel< TabId extends string = string >( {
	value,
	children,
	className,
}: ReportPageTabPanelProps< TabId > ) {
	return (
		<Tabs.Panel value={ value } className={ className }>
			{ children }
		</Tabs.Panel>
	);
}
