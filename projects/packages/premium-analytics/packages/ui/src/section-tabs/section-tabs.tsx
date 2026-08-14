import { Tabs } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './section-tabs.module.scss';
import type { ReactNode } from 'react';

export type SectionTab< TabId extends string = string > = {
	id: TabId;
	label: string;
};

export interface SectionTabsProps< TabId extends string = string > {
	/**
	 * The tabs to render, in order.
	 */
	tabs: SectionTab< TabId >[];

	value: TabId;

	onChange: ( id: TabId ) => void;

	children?: ReactNode;

	/**
	 * Optional class applied to the tab list wrapper. This component does not
	 * own any horizontal page-gutter padding itself, so callers that render the
	 * tab bar full-bleed (e.g. outside a padded content container) supply it here.
	 */
	className?: string;

	rootClassName?: string;
}

/**
 * The shared section tab bar.
 *
 * Purely presentational: it renders the tab triggers and reports selection
 * changes upward. Panel children render inside the same Tabs.Root so the
 * tablist and tab content share a complete tab/panel relationship.
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
	value: TabId;

	children?: ReactNode;

	className?: string;
}

/**
 * A tab panel for `SectionTabs` children.
 *
 * Consumers must use this rather than reaching for `Tabs.Panel` themselves:
 * Base UI's tabs context does not cross bundle copies, so a panel only finds
 * its root when both come from the same `Tabs` instance. Importing `Tabs` from
 * `@jetpack-premium-analytics/externals` is what makes that a single shared
 * instance for every consumer.
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
