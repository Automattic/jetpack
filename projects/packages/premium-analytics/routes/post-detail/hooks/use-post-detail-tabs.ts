/**
 * External dependencies
 */
import {
	useStatsEmailClicksBreakdown,
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
 * Whether a rate summary records any sends, opens or clicks.
 *
 * @param summary - A sanitized rate summary.
 * @return True when any count is positive.
 */
function hasEmailActivity( summary: StatsEmailBreakdown[ 'summary' ] | undefined ): boolean {
	return [ 'total_sends', 'total_opens', 'total_clicks' ].some(
		key => Number( summary?.[ key ] ?? 0 ) > 0
	);
}

/**
 * Resolves visible post-detail tabs and normalizes hidden-tab deep links.
 * Kept in full because the email-tab gating is not obvious from the code below.
 *
 * Tabs without a fixed composition stay hidden. Only a standard post can be
 * sent as a newsletter, so the email tabs hide once the post type is known to
 * be anything else (a page, a custom post type). Until the type is known they
 * show only when the URL already names an email tab, so a deep link never
 * falls back to Post traffic.
 *
 * Once the clicks rate summary answers with no sends, opens or clicks for a
 * standard post, `isEmailNotSent` is set and an email tab has no layout,
 * leaving the page to say the post was never sent in place of widgets that
 * would all be empty. While the summary loads or after it fails, the email
 * tabs keep their widgets, which surface their own loading and error states.
 *
 * A hidden-tab URL is replaced with the first visible tab, without adding a
 * history entry.
 *
 * The email tabs' widgets read the given report params instead of the URL
 * (see `useEmailTabScope`); until those are known, an email tab has no layout.
 *
 * @param postId            - The scoped post ID (0/NaN hides the email tabs).
 * @param emailReportParams - The report params pinned on the email tabs, once known.
 * @param emailScopeBlocked - The pinned params can no longer resolve (the summary
 *                          failed): mount the fixed layout unmodified so the
 *                          widgets surface their own error states instead of the
 *                          tab staying permanently blank.
 * @param postType          - The post type slug, once known.
 * @return Visible tabs, the active tab and layout, the active-tab setter, whether the post was never sent as a newsletter, and whether that is still being checked.
 */
export function usePostDetailTabs(
	postId: number,
	emailReportParams?: ReportParams,
	emailScopeBlocked = false,
	postType?: string
) {
	const [ storedTab, setActiveTab ] = useActiveTab();

	// The type is unknown until the summary loads. Meanwhile only a URL that
	// already names an email tab keeps them, so a deep link survives without
	// every page flashing tabs it will lose.
	const showEmailTabs =
		postId > 0 &&
		( postType === 'post' || ( postType === undefined && EMAIL_TAB_IDS.includes( storedTab ) ) );

	// Not the opens summary: it nulls every field when sends went unrecorded (legacy sends).
	// Runs alongside the summary rather than after it, so the not-sent answer is
	// ready when the type arrives.
	const gateEnabled = postId > 0 && ( postType === undefined || postType === 'post' );
	const gate = useStatsEmailClicksBreakdown( postId, 'rate', { enabled: gateEnabled } );
	const hasEmailStats = hasEmailActivity(
		( gate.data as StatsEmailBreakdown | undefined )?.summary
	);

	// Success, not `! isLoading`: that also goes false while the retryer is
	// paused (background tab, offline blip), which would flash the not-sent state.
	// The type is checked too: it arrives on its own request, and a page must
	// never say it was not sent as a newsletter while its tabs are still up.
	const isEmailNotSent = postType === 'post' && gate.isSuccess && ! hasEmailStats;
	// Until it answers, an email tab cannot tell its header and widgets from the
	// not-sent state, and drawing either first makes the tab jump.
	const isEmailSendPending = gateEnabled && ! gate.isSuccess && ! gate.isError;

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

	useEffect( () => {
		if ( storedTab !== activeTab ) {
			setActiveTab( activeTab, { replace: true } );
		}
	}, [ storedTab, activeTab, setActiveTab ] );

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

		if ( isEmailNotSent || isEmailSendPending ) {
			return [];
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
	}, [
		activeTab,
		isEmailTab,
		isEmailNotSent,
		isEmailSendPending,
		emailReportParams,
		emailScopeBlocked,
	] );

	return {
		tabs,
		activeTab,
		setActiveTab,
		layout,
		isEmailNotSent,
		isEmailSendPending,
	};
}
