import { Tabs } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './section-tabs.module.scss';
import type { ReactNode } from 'react';

/**
 * A resolved section tab ({ id, label }).
 */
export type SectionTab< TabId extends string = string > = {
	id: TabId;
	label: string;
};

export interface SectionTabsProps< TabId extends string = string > {
	/**
	 * The tabs to render, in order.
	 */
	tabs: SectionTab< TabId >[];

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

	/**
	 * Optional class applied to the tabs root.
	 */
	rootClassName?: string;
}

/**
 * The shared section tab bar.
 *
 * Purely presentational: it renders the tab triggers and reports selection
 * changes upward. Panel children render inside the same Tabs.Root so the
 * tablist and tab content share a complete tab/panel relationship.
 *
 * @param props               - Component props.
 * @param props.tabs          - The tabs to render, in order.
 * @param props.value         - The currently active tab ID.
 * @param props.onChange      - Called with the new tab ID when the user selects a different tab.
 * @param props.children      - Tab panel content.
 * @param props.className     - Optional class applied to the tab list wrapper.
 * @param props.rootClassName - Optional class applied to the tabs root.
 * @return The tab bar element.
 */
export function SectionTabs< TabId extends string = string >( {
	tabs,
	value,
	onChange,
	children,
	className,
	rootClassName,
}: SectionTabsProps< TabId > ) {
	const handleValueChange = useCallback(
		( tabId: string ) => onChange( tabId as TabId ),
		[ onChange ]
	);

	return (
		<Tabs.Root value={ value } onValueChange={ handleValueChange } className={ rootClassName }>
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

export interface SectionTabPanelProps< TabId extends string = string > {
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
 * A tab panel for `SectionTabs` children.
 *
 * Consumers must use this instead of `Tabs.Panel` from `@wordpress/ui`: routes
 * and shared packages can each bundle their own copy of `@wordpress/ui`, and
 * Base UI's tabs context does not cross bundle copies. Importing the panel and
 * root through the same package specifier guarantees both share one instance.
 *
 * @param props           - Component props.
 * @param props.value     - The tab this panel belongs to.
 * @param props.children  - The panel content.
 * @param props.className - Optional class applied to the panel element.
 * @return The tab panel element.
 */
export function SectionTabPanel< TabId extends string = string >( {
	value,
	children,
	className,
}: SectionTabPanelProps< TabId > ) {
	return (
		<Tabs.Panel value={ value } className={ className }>
			{ children }
		</Tabs.Panel>
	);
}
