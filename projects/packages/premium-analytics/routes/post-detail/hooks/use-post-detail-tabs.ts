/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { DEFAULT_TAB_ID, getPostDetailTabs, POST_DETAIL_TAB_LAYOUTS } from '../config';
import { useActiveTab } from './use-active-tab';

/**
 * Resolve the visible post-detail tabs and normalize hidden-tab deep links.
 *
 * Tabs without a fixed composition remain hidden. If the URL points at one,
 * the first visible tab renders immediately and replaces the hidden value in
 * the URL without adding a browser-history entry.
 *
 * @return Visible tabs, the active tab and layout, and the active-tab setter.
 */
export function usePostDetailTabs() {
	const tabs = useMemo( () => {
		const allTabs = getPostDetailTabs();
		const withContent = allTabs.filter( tab => POST_DETAIL_TAB_LAYOUTS[ tab.id ].length > 0 );

		// Keep the page renderable if all compositions are temporarily empty.
		return withContent.length > 0 ? withContent : allTabs;
	}, [] );

	const [ storedTab, setActiveTab ] = useActiveTab();
	const activeTab = tabs.find( tab => tab.id === storedTab )?.id ?? tabs[ 0 ]?.id ?? DEFAULT_TAB_ID;

	useEffect( () => {
		if ( storedTab !== activeTab ) {
			setActiveTab( activeTab, { replace: true } );
		}
	}, [ storedTab, activeTab, setActiveTab ] );

	return {
		tabs,
		activeTab,
		setActiveTab,
		layout: POST_DETAIL_TAB_LAYOUTS[ activeTab ],
	};
}
