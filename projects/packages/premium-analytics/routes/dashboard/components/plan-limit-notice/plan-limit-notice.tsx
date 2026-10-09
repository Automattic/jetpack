/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	AnalyticsQueryClientProvider,
	useStatsAppNoticeMutation,
	useStatsAppNotices,
	useStatsAppPlanUsage,
	type StatsAppPlanUsage,
} from '@jetpack-premium-analytics/data';
import { Notice } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { statsUpgradeUrl, useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './plan-limit-notice.module.scss';
import type { JSX } from 'react';

// The share of the limit at which Stats starts warning, matching Calypso.
const NEAR_LIMIT_USAGE_RATIO = 0.9;

// Stats postpones this notice for a week, and the state is shared with it.
const POSTPONE_SECONDS = 7 * 24 * 60 * 60;

type PlanLimitStatus = {
	isOver: boolean;
	used: number;
	limit: number;
};

// Once per page load, not per mount: every section tab mounts its own copy.
const viewedThisLoad = new Set< string >();

/**
 * Reset the once-per-load view latch. Test-only.
 */
export function resetPlanLimitNoticeForTesting() {
	viewedThisLoad.clear();
}

type PlanLimitNoticeProps = {
	/**
	 * Whether the surface the notice belongs to is ready; nothing shows until then.
	 */
	enabled: boolean;
};

/**
 * Where this cycle's views stand against the plan's limit. A missing or zero
 * limit means there is nothing to meter against.
 *
 * @param usage - The plan usage report.
 * @return The status, or `null` while the site is clear of the limit.
 */
function getPlanLimitStatus( usage?: StatsAppPlanUsage ): PlanLimitStatus | null {
	const limit = usage?.views_limit;
	if ( ! limit ) {
		return null;
	}

	const used = usage.current_usage?.views_count ?? 0;
	if ( used < limit * NEAR_LIMIT_USAGE_RATIO ) {
		return null;
	}

	return { isOver: used >= limit, used, limit };
}

/**
 * Reads the plan usage and renders the notice when the site nears or passes its limit.
 *
 * @param {PlanLimitNoticeProps} props - Component props.
 * @return The notice, or nothing.
 */
function ConnectedNotice( { enabled }: PlanLimitNoticeProps ): JSX.Element | null {
	// Stats shows this notice on Jetpack-connected sites only, and VIP sites are exempt from the limit.
	const isEligible = enabled && ! isSimpleSite() && getScriptData()?.site?.host !== 'vip';

	const { data: usage } = useStatsAppPlanUsage( { enabled: isEligible } );
	const status = useMemo(
		() => ( isEligible ? getPlanLimitStatus( usage ) : null ),
		[ isEligible, usage ]
	);

	// Only the near-limit notice can be put off; past the limit it stays for the cycle.
	const isNear = !! status && ! status.isOver;
	const { data: notices } = useStatsAppNotices( undefined, { enabled: isNear } );
	const { mutate: updateNotice } = useStatsAppNoticeMutation();
	const [ isPostponed, setIsPostponed ] = useState( false );
	const trackEvent = useTrackEvent();

	const isHeld = isNear && ( ! notices || notices.tier_upgrade === false || isPostponed );
	const statusName = status?.isOver ? 'over' : 'near';

	useEffect( () => {
		if ( ! status || isHeld || viewedThisLoad.has( statusName ) ) {
			return;
		}

		viewedThisLoad.add( statusName );
		trackEvent( 'jetpack_premium_analytics_plan_limit_notice_view', { status: statusName } );
	}, [ status, isHeld, statusName, trackEvent ] );

	const postpone = useCallback( () => {
		setIsPostponed( true );
		updateNotice( { id: 'tier_upgrade', status: 'postponed', postponed_for: POSTPONE_SECONDS } );
		trackEvent( 'jetpack_premium_analytics_plan_limit_notice_dismiss' );
	}, [ updateNotice, trackEvent ] );

	const recordUpgradeClick = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_plan_limit_notice_upgrade_click', {
			status: statusName,
		} );
	}, [ trackEvent, statusName ] );

	if ( ! status || isHeld ) {
		return null;
	}

	const upgradeHref = statsUpgradeUrl( 'jetpack-premium-analytics-plan-limit-notice' );

	const usageSentence = sprintf(
		/* translators: 1: views used in the current billing cycle, 2: the plan's views limit. */
		__( '%1$s of %2$s billable views used this cycle.', 'jetpack-premium-analytics-pkg' ),
		formatMetricValue( status.used, 'number', { decimals: 0 } ),
		formatMetricValue( status.limit, 'number', { decimals: 0 } )
	);

	const { isOver } = status;
	const title = isOver
		? __( 'You have gone over your plan’s view limit', 'jetpack-premium-analytics-pkg' )
		: __( 'You are approaching your plan’s view limit', 'jetpack-premium-analytics-pkg' );
	const consequence = isOver
		? __(
				'Views past the limit are not being counted, so these totals are short until the cycle restarts.',
				'jetpack-premium-analytics-pkg'
			)
		: __(
				'Views past the limit will not be counted until it restarts.',
				'jetpack-premium-analytics-pkg'
			);

	return (
		<Notice.Root intent={ isOver ? 'warning' : 'info' } className={ styles.notice }>
			<Notice.Title>{ title }</Notice.Title>
			<Notice.Description>{ `${ usageSentence } ${ consequence }` }</Notice.Description>

			{ upgradeHref && (
				<Notice.Actions>
					<Notice.ActionLink href={ upgradeHref } onClick={ recordUpgradeClick }>
						{ __( 'Upgrade plan', 'jetpack-premium-analytics-pkg' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			) }

			{ ! isOver && (
				<Notice.CloseIcon
					label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
					onClick={ postpone }
				/>
			) }
		</Notice.Root>
	);
}

/**
 * Tells the reader their site is close to, or past, the views its plan allows
 * this billing cycle, and offers the upgrade. Brings its own query provider,
 * since the dashboard stage has none.
 *
 * @param {PlanLimitNoticeProps} props - Component props.
 * @return The notice, or nothing.
 */
export function PlanLimitNotice( { enabled }: PlanLimitNoticeProps ): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<ConnectedNotice enabled={ enabled } />
		</AnalyticsQueryClientProvider>
	);
}
