/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	AnalyticsQueryClientProvider,
	useStatsAppNoticeMutation,
	useStatsAppNotices,
	useStatsAppPlanUsage,
} from '@jetpack-premium-analytics/data';
import { Notice } from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getPlanLimitStatus } from '../../../plan-limit-status';
import { usePlanUpgradeLinkProps } from '../stats-settings/plan-usage';
import styles from './plan-limit-notice.module.scss';
import type { JSX } from 'react';

// Stats postpones this notice for a week, and the state is shared with it.
const POSTPONE_SECONDS = 7 * 24 * 60 * 60;

// Once per page load, not per mount: every section tab mounts its own copy.
const viewedThisLoad = new Set< string >();

/**
 * Reset the once-per-load view latch. Test-only.
 */
export function resetPlanLimitNoticeForTesting() {
	viewedThisLoad.clear();
}

/**
 * Reads the plan usage and renders the notice when the site nears or passes its limit.
 *
 * @return The notice, or nothing.
 */
function ConnectedNotice(): JSX.Element | null {
	// Stats shows this notice on Jetpack-connected sites only, and VIP sites are exempt from the limit.
	const isEligible = ! isSimpleSite() && getScriptData()?.site?.host !== 'vip';

	const { data: usage } = useStatsAppPlanUsage( { enabled: isEligible } );
	const status = isEligible ? getPlanLimitStatus( usage ) : null;

	// Only the near-limit notice can be put off; past the limit it stays for the cycle, even while
	// Stats has `tier_upgrade` postponed.
	const isNear = !! status && ! status.isOver;
	const { data: notices } = useStatsAppNotices( undefined, { enabled: isNear } );
	const { createErrorNotice } = useDispatch( 'core/notices' );
	const { mutate: updateNotice } = useStatsAppNoticeMutation( {
		onError: () =>
			createErrorNotice(
				__( 'Couldn’t dismiss the notice. Please try again.', 'jetpack-premium-analytics-pkg' ),
				{ type: 'snackbar' }
			),
	} );
	const trackEvent = useTrackEvent();
	const upgradeLink = usePlanUpgradeLinkProps( 'jetpack-premium-analytics-plan-limit-notice' );

	const isHeld = isNear && ( ! notices || notices.tier_upgrade === false );
	const statusName = status?.isOver ? 'over' : 'near';

	useEffect( () => {
		if ( ! status || isHeld || viewedThisLoad.has( statusName ) ) {
			return;
		}

		viewedThisLoad.add( statusName );
		trackEvent( 'jetpack_premium_analytics_plan_limit_notice_view', { status: statusName } );
	}, [ status, isHeld, statusName, trackEvent ] );

	const postpone = useCallback( () => {
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

	const { isOver } = status;
	const title = isOver
		? __( 'You have reached your views limit', 'jetpack-premium-analytics-pkg' )
		: __( 'You are nearing your monthly limit', 'jetpack-premium-analytics-pkg' );
	const description = isOver
		? __(
				'Your access to the traffic dashboard may be disrupted in the future without an upgrade.',
				'jetpack-premium-analytics-pkg'
			)
		: __(
				'Your site is receiving more attention and is close to the monthly view limit provided by your current plan. Consider increasing your tier limit to avoid potential service disruptions.',
				'jetpack-premium-analytics-pkg'
			);

	return (
		<Notice.Root intent={ isOver ? 'warning' : 'info' } className={ styles.notice }>
			<Notice.Title>{ title }</Notice.Title>
			<Notice.Description>{ description }</Notice.Description>

			{ upgradeLink && (
				<Notice.Actions>
					<Notice.ActionLink { ...upgradeLink } onClick={ recordUpgradeClick }>
						{ __( 'Upgrade now', 'jetpack-premium-analytics-pkg' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			) }

			{ ! isOver && (
				<Notice.CloseIconButton
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
 * @return The notice, or nothing.
 */
export function PlanLimitNotice(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<ConnectedNotice />
		</AnalyticsQueryClientProvider>
	);
}
