/**
 * External dependencies
 */
import {
	useStatsEmailClicksBreakdown,
	type StatsEmailBreakdown,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { ButtonLink } from '@jetpack-premium-analytics/externals';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { isEmailSection } from './config';
import { useEmailTabScope } from './use-email-tab-scope';
import type { PostSummary } from './use-post-summary';
import type { SingleReportPageSection } from '../../registry';
import type { SectionState, SectionsContext } from '../adapter';
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
 * The post page's sections. Kept in full because the email gating is not obvious from the code.
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
 * @param context.entityId   - The post id.
 * @param context.activeSlug - The section the URL names, if any.
 * @param context.timeZone   - The site timezone.
 * @return One state per section, in the record's order.
 */
export function usePostSections(
	summary: PostSummary,
	sections: SingleReportPageSection[],
	{ entityId, activeSlug, timeZone }: SectionsContext
): SectionState[] {
	const postId = entityId;
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
	const emailScope = useEmailTabScope( postId, allTimeStart, timeZone );
	const emailScopeBlocked = ! emailScope && ! summary.isLoading && summary.isError;

	return useMemo(
		() =>
			sections.map( section => {
				if ( ! isEmailSection( section.slug ) ) {
					return { section };
				}

				const state: SectionState = { section, hidden: ! showEmail };
				if ( isEmailNotSent ) {
					state.emptyState = notSentEmptyState();
				} else if ( isEmailSendPending || ! emailScope ) {
					state.scope = ! isEmailSendPending && emailScopeBlocked ? 'blocked' : 'pending';
				} else {
					state.scope = { reportParams: emailScope.reportParams, range: emailScope.range };
				}

				return state;
			} ),
		[ sections, showEmail, isEmailNotSent, isEmailSendPending, emailScope, emailScopeBlocked ]
	);
}
