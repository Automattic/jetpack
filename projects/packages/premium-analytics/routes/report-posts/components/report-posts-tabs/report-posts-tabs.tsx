/**
 * External dependencies
 */
import { Tabs } from '@wordpress/ui';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-posts-tabs.module.scss';
import type { ReportPostsTab, ReportPostsTabId } from '../../config';

type ReportPostsTabsProps = {
	/** The tabs to render, in order. */
	tabs: ReportPostsTab[];
	/** The currently active tab ID. */
	value: ReportPostsTabId;
	/** Called with the new tab ID when the user selects a different tab. */
	onChange: ( id: ReportPostsTabId ) => void;
};

/**
 * The report's internal tab bar (Posts & Pages / Archives).
 *
 * Purely presentational: it renders the tab triggers and reports selection
 * changes upward — the page swaps the records table below it. Mirrors the
 * post-detail tab bar.
 *
 * @param props          - Component props.
 * @param props.tabs     - The tabs to render, in order.
 * @param props.value    - The currently active tab ID.
 * @param props.onChange - Called with the new tab ID when the user selects a different tab.
 * @return The tab bar element.
 */
export function ReportPostsTabs( { tabs, value, onChange }: ReportPostsTabsProps ) {
	const handleValueChange = useCallback(
		( tabId: string ) => onChange( tabId as ReportPostsTabId ),
		[ onChange ]
	);

	return (
		<Tabs.Root value={ value } onValueChange={ handleValueChange }>
			<div className={ styles.tabList }>
				<Tabs.List variant="minimal">
					{ tabs.map( tab => (
						<Tabs.Tab key={ tab.id } value={ tab.id }>
							{ tab.label }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			</div>
		</Tabs.Root>
	);
}
