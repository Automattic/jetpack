import { Tabs } from '@wordpress/ui';
import { useCallback } from 'react';
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
	const handleValueChange = useCallback(
		( tabId: string ) => onChange( tabId as PostDetailTabId ),
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
			{ children }
		</Tabs.Root>
	);
}
