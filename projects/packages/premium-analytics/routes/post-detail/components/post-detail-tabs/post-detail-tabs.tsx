import { SectionTabs } from '@jetpack-premium-analytics/ui';
import styles from './post-detail-tabs.module.scss';
import type { PostDetailTab, PostDetailTabId } from '../../config';
import type { ReactNode } from 'react';

type PostDetailTabsProps = {
	/**
	 * The tabs to render, in order.
	 */
	tabs: PostDetailTab[];

	/**
	 * The currently active tab ID.
	 */
	value: PostDetailTabId;

	/**
	 * Called with the new tab ID when the user selects a different tab.
	 */
	onChange: ( id: PostDetailTabId ) => void;

	/**
	 * Tab panel content.
	 */
	children?: ReactNode;
};

/**
 * The post-detail tab bar.
 *
 * Purely presentational: it renders the tab triggers and reports selection
 * changes upward. Panel children render inside the same Tabs.Root so the
 * tablist and tab content share a complete tab/panel relationship.
 *
 * @param props          - Component props.
 * @param props.tabs     - The tabs to render, in order.
 * @param props.value    - The currently active tab ID.
 * @param props.onChange - Called with the new tab ID when the user selects a different tab.
 * @param props.children - Tab panel content.
 * @return The tab bar element.
 */
export function PostDetailTabs( { tabs, value, onChange, children }: PostDetailTabsProps ) {
	return (
		<SectionTabs tabs={ tabs } value={ value } onChange={ onChange } className={ styles.tabList }>
			{ children }
		</SectionTabs>
	);
}
