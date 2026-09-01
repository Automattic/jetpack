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

/**
 * Resolves visible post-detail tabs and normalizes hidden-tab deep links.
 * Kept in full because the email-tab gating and URL-normalization order are
 * not obvious from the code below.
 *
 * Tabs without a fixed composition stay hidden. Email tabs also require
 * `total_sends` > 0 from the opens-rate summary, and fail closed on anything
 * the gate query has actually answered: a zero count or an error hides them.
 * While that query is still in flight the answer is unknown, so a URL already
 * naming an email tab keeps its tabs — otherwise a reload would render the
 * whole Post traffic page first and throw it away (WOOA7S-2059).
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
 * @param emailScopeBlocked - The pinned params can no longer resolve (the summary
 *                          failed): mount the fixed layout unmodified so the
 *                          widgets surface their own error states instead of the
 *                          tab staying permanently blank.
 * @return Visible tabs, the active tab and layout, and the active-tab setter.
 */
export function usePostDetailTabs(
	postId: number,
	emailReportParams?: ReportParams,
	emailScopeBlocked = false
) {
	const opens = useStatsEmailOpensBreakdown( postId, 'rate', { enabled: postId > 0 } );
	const summary = ( opens.data as StatsEmailBreakdown | undefined )?.summary;
	const hasEmailStats = Number( summary?.total_sends ?? 0 ) > 0;

	const [ storedTab, setActiveTab ] = useActiveTab();
	const storedIsEmailTab = EMAIL_TAB_IDS.includes( storedTab );
	const showEmailTabs = hasEmailStats || ( storedIsEmailTab && opens.isLoading );

	const tabs = useMemo( () => {
		const allTabs = getPostDetailTabs();
		const withContent = allTabs.filter(
			tab =>
				POST_DETAIL_TAB_LAYOUTS[ tab.id ].length > 0 &&
				( showEmailTabs || ! EMAIL_TAB_IDS.includes( tab.id ) )
		);

		// Keep the page renderable if all compositions are temporarily empty.
		return withContent.length > 0 ? withContent : allTabs;
	}, [ showEmailTabs ] );

	const activeTab = tabs.find( tab => tab.id === storedTab )?.id ?? tabs[ 0 ]?.id ?? DEFAULT_TAB_ID;

	// Non-email/no-scope deep links normalize immediately; a pending or
	// failed email-tab gate holds off so a real deep link isn't destroyed.
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
			return emailScopeBlocked ? fixed : [];
		}

		return fixed.map( widget => ( {
			...widget,
			attributes: {
				...( widget.attributes as Record< string, unknown > | undefined ),
				reportParams: emailReportParams,
			},
		} ) );
	}, [ activeTab, isEmailTab, emailReportParams, emailScopeBlocked ] );

	return {
		tabs,
		activeTab,
		setActiveTab,
		layout,
	};
}
