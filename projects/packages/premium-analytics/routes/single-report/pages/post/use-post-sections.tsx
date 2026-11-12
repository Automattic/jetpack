/**
 * External dependencies
 */
import {
	useStatsEmailClicksBreakdown,
	type StatsEmailBreakdown,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { ButtonLink } from '@jetpack-premium-analytics/externals';
import { getPostTypeCopy } from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { EMAIL_WINDOW_PARAM, TRAFFIC_SECTION_SLUG, isEmailSection } from './config';
import {
	DEFAULT_EMAIL_SEND_WINDOW,
	EMAIL_SEND_WINDOWS,
	isEmailSendWindow,
	useEmailTabScope,
	type EmailSendWindow,
} from './use-email-tab-scope';
import type { PostSummary } from './use-post-summary';
import type { SingleReportPageSection } from '../../registry';
import type { SectionScopeControl, SectionState, SectionsContext } from '../adapter';
import type { PageEmptyStateProps } from '@jetpack-premium-analytics/widgets-toolkit';

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
 * The state an email section shows in place of its header and widgets for a post never sent.
 *
 * @return The empty state.
 */
function notSentEmptyState(): PageEmptyStateProps {
	return {
		title: __( 'This post hasn’t been sent as a newsletter', 'jetpack-premium-analytics-pkg' ),
		description: __(
			'Newsletter can help you reach subscribers in their inbox.',
			'jetpack-premium-analytics-pkg'
		),
		actions: (
			<ButtonLink
				variant="outline"
				size="compact"
				href="https://jetpack.com/support/newsletter/"
				openInNewTab
			>
				{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
			</ButtonLink>
		),
	};
}

/**
 * How the send-window control names each window.
 *
 * @param window - The window.
 * @return Its label.
 */
function emailSendWindowLabel( window: EmailSendWindow ): string {
	switch ( window ) {
		case 'send-day':
			return __( 'Send day, by hour', 'jetpack-premium-analytics-pkg' );
		case 'first-week':
			return __( 'First 7 days', 'jetpack-premium-analytics-pkg' );
		case 'all-time':
			return __( 'All time, by month', 'jetpack-premium-analytics-pkg' );
		case 'first-30-days':
		default:
			return __( 'First 30 days', 'jetpack-premium-analytics-pkg' );
	}
}

/**
 * The post page's sections. Kept in full because the email gating is not obvious from the code.
 *
 * The traffic section is named for the post type ("Page traffic"), with a placeholder until the
 * type loads.
 *
 * Only a standard post can be sent as a newsletter, so the email sections hide once the post
 * type is known to be anything else. Until the type is known they show only when the URL already
 * names one, so a deep link never falls back to Post traffic. Their widgets report over the first
 * 30 days after the send (`useEmailTabScope`), handed over as a pinned window; until that window
 * is known they wait, unless the summary failed, in which case they mount and surface their own
 * errors. Once the clicks rate summary answers with no activity for a standard post, the never-sent
 * state replaces the header and the widgets.
 *
 * @param summary            - The post summary, in any state.
 * @param sections           - The record's sections.
 * @param context            - The entity, the section the URL names and the site timezone.
 * @param context.entityId   - The post id, as the URL carries it.
 * @param context.activeSlug - The section the URL names, if any.
 * @param context.timeZone   - The site timezone.
 * @param context.search     - The URL's search params, for the send window.
 * @param context.setSearch  - Writes the send window to the URL.
 * @return One state per section, in the record's order.
 */
export function usePostSections(
	summary: PostSummary,
	sections: SingleReportPageSection[],
	{ entityId, activeSlug, timeZone, search, setSearch }: SectionsContext
): SectionState[] {
	const postId = Number( entityId );
	const postType = summary.type;
	const showEmail =
		postId > 0 &&
		( postType === 'post' || ( postType === undefined && isEmailSection( activeSlug ) ) );

	// Not the opens summary: it nulls every field when sends went unrecorded (legacy sends).
	const gateEnabled = postId > 0 && ( postType === undefined || postType === 'post' );
	const gate = useStatsEmailClicksBreakdown( postId, 'rate', { enabled: gateEnabled } );
	const hasEmailStats = hasEmailActivity(
		( gate.data as StatsEmailBreakdown | undefined )?.summary
	);
	// Success, not `! isLoading`: a paused retry would otherwise flash the never-sent state.
	const isEmailNotSent = postType === 'post' && gate.isSuccess && ! hasEmailStats;
	const isEmailSendPending = gateEnabled && ! gate.isSuccess && ! gate.isError;

	const allTimeStart = useMemo(
		() => parseSiteDateTime( summary.allTimeStart ),
		[ summary.allTimeStart ]
	);
	const requestedWindow = search[ EMAIL_WINDOW_PARAM ];
	const emailWindow = isEmailSendWindow( requestedWindow )
		? requestedWindow
		: DEFAULT_EMAIL_SEND_WINDOW;
	const emailScope = useEmailTabScope( postId, allTimeStart, timeZone, emailWindow );
	const setEmailWindow = useCallback(
		( value: string ) => {
			if ( isEmailSendWindow( value ) && value !== emailWindow ) {
				setSearch( { [ EMAIL_WINDOW_PARAM ]: value } );
			}
		},
		[ emailWindow, setSearch ]
	);
	const emailWindowControl = useMemo< SectionScopeControl >(
		() => ( {
			field: {
				id: EMAIL_WINDOW_PARAM,
				type: 'jpa/select',
				label: __( 'Time since send', 'jetpack-premium-analytics-pkg' ),
				elements: EMAIL_SEND_WINDOWS.map( value => ( {
					value,
					label: emailSendWindowLabel( value ),
				} ) ),
			},
			value: emailWindow,
			onChange: setEmailWindow,
		} ),
		[ emailWindow, setEmailWindow ]
	);
	// A failed or missing post never brings a publish day, so the section stops waiting for it.
	const hasNoPost = summary.isError || summary.isNotFound;
	const emailScopeBlocked = ! emailScope && ! summary.isLoading && hasNoPost;

	return useMemo(
		() =>
			sections.map( section => {
				if ( section.slug === TRAFFIC_SECTION_SLUG ) {
					// The label names the post type, so it waits for the type to load.
					return {
						section,
						label: getPostTypeCopy( postType ).traffic,
						...( summary.isLoading && { isPending: true } ),
					};
				}
				if ( ! isEmailSection( section.slug ) ) {
					return { section };
				}

				const state: SectionState = { section, hidden: ! showEmail };
				if ( isEmailNotSent ) {
					state.emptyState = notSentEmptyState();
				} else if ( isEmailSendPending || ! emailScope ) {
					state.scope = ! isEmailSendPending && emailScopeBlocked ? 'blocked' : 'pending';
				} else {
					state.scope = {
						reportParams: emailScope.reportParams,
						range: emailScope.range,
						control: emailWindowControl,
					};
				}

				return state;
			} ),
		[
			sections,
			postType,
			summary.isLoading,
			showEmail,
			isEmailNotSent,
			isEmailSendPending,
			emailScope,
			emailScopeBlocked,
			emailWindowControl,
		]
	);
}
