/**
 * External dependencies
 */
import {
	useStatsEmailOpensBreakdown,
	type StatsEmailBreakdown,
} from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { DEFAULT_TAB_ID, getPostDetailTabs, POST_DETAIL_TAB_LAYOUTS } from '../config';
import { useActiveTab } from './use-active-tab';
import type { PostDetailTabId } from '../config';

/** Tabs that only apply to posts delivered to subscribers by email. */
const EMAIL_TAB_IDS: readonly PostDetailTabId[] = [ 'email-opens', 'email-clicks' ];

/**
 * Resolve the visible post-detail tabs and normalize hidden-tab deep links.
 *
 * Tabs without a fixed composition remain hidden, and the email tabs only
 * show for posts that were actually sent to subscribers: `total_sends` from
 * the per-post opens rate summary is the send signal. (Calypso infers the
 * same availability from subscription settings and post metadata because it
 * decides before fetching; the summary is the direct source, and the Email
 * top row widget reads the same query, so React Query shares the result.)
 * The gate fails closed — while the summary is loading or errored the email
 * tabs stay hidden, so they appear rather than disappear.
 *
 * If the URL points at a hidden tab, the first visible tab renders
 * immediately and replaces the hidden value in the URL without adding a
 * browser-history entry — but an email-tab URL is only normalized once the
 * gate query has succeeded, so a deep link survives the summary's first load
 * and any failed request.
 *
 * @param postId - The scoped post ID (0/NaN disables the email-tab check).
 * @return Visible tabs, the active tab and layout, and the active-tab setter.
 */
export function usePostDetailTabs( postId: number ) {
	const opens = useStatsEmailOpensBreakdown( postId, 'rate', { enabled: postId > 0 } );
	const summary = ( opens.data as StatsEmailBreakdown | undefined )?.summary;
	const hasEmailStats = Number( summary?.total_sends ?? 0 ) > 0;

	const tabs = useMemo( () => {
		const allTabs = getPostDetailTabs();
		const withContent = allTabs.filter(
			tab =>
				POST_DETAIL_TAB_LAYOUTS[ tab.id ].length > 0 &&
				( hasEmailStats || ! EMAIL_TAB_IDS.includes( tab.id ) )
		);

		// Keep the page renderable if all compositions are temporarily empty.
		return withContent.length > 0 ? withContent : allTabs;
	}, [ hasEmailStats ] );

	const [ storedTab, setActiveTab ] = useActiveTab();
	const activeTab = tabs.find( tab => tab.id === storedTab )?.id ?? tabs[ 0 ]?.id ?? DEFAULT_TAB_ID;

	// Normalize an email-tab URL only after the gate query has *succeeded*:
	// while the send summary is loading — or after it fails, when we still
	// don't know whether the post has email stats — the email tabs are hidden
	// provisionally, and rewriting the URL then would destroy a legitimate
	// deep link. The visible fallback still renders immediately; the URL write
	// waits for a definitive answer (a later successful refetch settles it).
	// Deep links to non-email tabs don't depend on the gate and normalize
	// right away; without a valid post scope the query never runs, so email
	// deep links normalize immediately there too.
	const storedIsEmailTab = EMAIL_TAB_IDS.includes( storedTab as PostDetailTabId );
	const canNormalize = ! storedIsEmailTab || postId <= 0 || opens.isSuccess;

	useEffect( () => {
		if ( canNormalize && storedTab !== activeTab ) {
			setActiveTab( activeTab, { replace: true } );
		}
	}, [ canNormalize, storedTab, activeTab, setActiveTab ] );

	return {
		tabs,
		activeTab,
		setActiveTab,
		layout: POST_DETAIL_TAB_LAYOUTS[ activeTab ],
	};
}
