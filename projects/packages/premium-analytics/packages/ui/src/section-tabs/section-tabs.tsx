import { Skeleton, Tabs, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './section-tabs.module.scss';
import type { ReactNode, Ref, TransitionEvent } from 'react';

export type SectionTab< TabId extends string = string > = {
	id: TabId;
	label: string;
	disabled?: boolean;
	/** The label waits on data that has not loaded: a placeholder stands in for it. */
	isPending?: boolean;
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
	 * Optional class applied to the tab list wrapper, which already carries the
	 * page gutter and the page header's fill.
	 */
	className?: string;

	rootClassName?: string;

	/** Receives the tab list wrapper, for a tour step to highlight. */
	tabListRef?: Ref< HTMLDivElement >;
}

// `Tabs.List` measures its overflow on resize and scroll only. When a tab narrows, the indicator is still wider while it animates, so the list stays faded once it settles; a scroll event makes it measure again.
function remeasureOverflow( event: TransitionEvent< HTMLDivElement > ) {
	if ( event.propertyName === 'width' ) {
		event.currentTarget.querySelector( '[role="tablist"]' )?.dispatchEvent( new Event( 'scroll' ) );
	}
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
	tabListRef,
}: SectionTabsProps< TabId > ) {
	const handleValueChange = useCallback(
		( tabId: string ) => onChange( tabId as TabId ),
		[ onChange ]
	);

	return (
		<Tabs.Root value={ value } onValueChange={ handleValueChange } className={ rootClassName }>
			<div
				ref={ tabListRef }
				className={ clsx( styles.tabList, className ) }
				onTransitionEnd={ remeasureOverflow }
			>
				<Tabs.List variant="minimal">
					{ tabs.map( tab => (
						<Tabs.Tab key={ tab.id } value={ tab.id } disabled={ tab.disabled }>
							{ tab.isPending ? (
								<>
									<VisuallyHidden>
										{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }
									</VisuallyHidden>
									<Skeleton className={ styles.pendingLabel } />
								</>
							) : (
								tab.label
							) }
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
