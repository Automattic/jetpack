/**
 * External dependencies
 */
import {
	useStatsEmailOpensBreakdown,
	type ReportParams,
	type StatsEmailBreakdown,
} from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import {
	DEFAULT_TAB_ID,
	EMAIL_TAB_IDS,
	getPostDetailTabs,
	POST_DETAIL_TAB_LAYOUTS,
} from '../config';
import { useActiveTab } from './use-active-tab';
import type { PostDetailTabId } from '../config';

/**
 * Resolves visible post-detail tabs and normalizes hidden-tab deep links.
 * Kept in full because the email-tab gating and URL-normalization order are
 * not obvious from the code below.
 *
 * Tabs without a fixed composition stay hidden. Email tabs also require
 * `total_sends` > 0 from the opens-rate summary, and fail closed: they stay
 * hidden while that query is loading or has errored.
 *
 * A hidden-tab URL is replaced with the first visible tab, without adding a
 * history entry. An email-tab URL is normalized only once the gate query
 * succeeds, so a deep link survives the summary's first load or a failure.
 *
 * The email tabs' widgets read the given report params instead of the URL
 * (see `useEmailTabScope`); until those are known, an email tab has no layout.
 *
 * @param postId            - The scoped post ID (0/NaN disables the email-tab check).
 * @param emailReportParams - The report params pinned on the email tabs, once known.
 * @return Visible tabs, the active tab and layout, and the active-tab setter.
 */
export function usePostDetailTabs( postId: number, emailReportParams?: ReportParams ) {
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

	// Non-email/no-scope deep links normalize immediately; a pending or
	// failed email-tab gate holds off so a real deep link isn't destroyed.
	const storedIsEmailTab = EMAIL_TAB_IDS.includes( storedTab as PostDetailTabId );
	const canNormalize = ! storedIsEmailTab || postId <= 0 || opens.isSuccess;

	useEffect( () => {
		if ( canNormalize && storedTab !== activeTab ) {
			setActiveTab( activeTab, { replace: true } );
		}
	}, [ canNormalize, storedTab, activeTab, setActiveTab ] );

	// The page's no-comparison invariant is the report scope the stage declares,
	// so the layout is the tab's fixed one. `WidgetRoot` prefers a widget's own
	// `reportParams` attribute over the URL, which is how the email tabs pin
	// their window.
	const isEmailTab = EMAIL_TAB_IDS.includes( activeTab );
	const layout = useMemo( () => {
		const fixed = POST_DETAIL_TAB_LAYOUTS[ activeTab ];

		if ( ! isEmailTab ) {
			return fixed;
		}

		if ( ! emailReportParams ) {
			return [];
		}

		return fixed.map( widget => ( {
			...widget,
			attributes: {
				...( widget.attributes as Record< string, unknown > | undefined ),
				reportParams: emailReportParams,
			},
		} ) );
	}, [ activeTab, isEmailTab, emailReportParams ] );

	return {
		tabs,
		activeTab,
		setActiveTab,
		layout,
	};
}
