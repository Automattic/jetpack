/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	useStatsAppNoticeMutation,
	useStatsAppNotices,
	type StatsAppNotices,
} from '@jetpack-premium-analytics/data';
import { Notice } from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getPlanUpgradeUrl } from '../stats-settings/plan-usage';
import styles from './free-site-upgrade-notice.module.scss';
import type { JSX } from 'react';

const NOTICE_ID = 'free_site_upgrade';

// Stats postpones this notice for ten years, so a dismissal is final.
const POSTPONE_SECONDS = 3650 * 24 * 60 * 60;

const DELAY_AFTER_FIRST_VISIT_MS = 30 * 24 * 60 * 60 * 1000;

// Tiers whose plan has no paid Stats. `unknown` is left out: it may be a paid site whose plan has not synced.
const FREE_STATS_TIERS = [ 'jetpack-free', 'free', 'legacy-free', 'legacy-basic' ];

// Stats dismissed these under their former IDs; the banner replaced both.
const REPLACED_NOTICE_IDS = [ 'do_you_love_jetpack_stats', 'commercial_site_upgrade' ] as const;

const LEARN_MORE_URL =
	'https://jetpack.com/support/jetpack-stats/free-or-paid/#what-a-paid-plan-adds';

// Once per page load, not per mount: every section tab mounts its own copy.
let viewedThisLoad = false;

/**
 * Reset the once-per-load view latch. Test-only.
 */
export function resetFreeSiteUpgradeNoticeForTesting() {
	viewedThisLoad = false;
}

/**
 * Whether the reader dismissed the banner, or one of the notices it replaced.
 *
 * @param notices - The Stats notice visibility state.
 * @return Whether the banner stays hidden.
 */
function isDismissed( notices: StatsAppNotices ): boolean {
	return [ NOTICE_ID, ...REPLACED_NOTICE_IDS ].some( id => notices[ id ] === false );
}

/**
 * Whether the site qualifies for the banner from what the page already knows: a connected,
 * non-VIP site without paid Stats that first opened the dashboard over 30 days ago.
 *
 * @return Whether the banner may show.
 */
function isEligible(): boolean {
	const scriptData = getScriptData();
	if ( isSimpleSite() || scriptData?.site?.host === 'vip' ) {
		return false;
	}

	const tier = scriptData?.premium_analytics?.plan_gates?.tier;
	const firstVisit = scriptData?.premium_analytics?.first_visit;
	if ( ! tier || ! FREE_STATS_TIERS.includes( tier ) || ! firstVisit ) {
		return false;
	}

	return Date.now() - firstVisit * 1000 >= DELAY_AFTER_FIRST_VISIT_MS;
}

/**
 * Whether the free site upgrade banner shows.
 *
 * @return `undefined` while the dismissal state loads, otherwise whether it shows.
 */
export function useFreeSiteUpgradeNoticeVisibility(): boolean | undefined {
	const eligible = isEligible();
	const { data: notices, isError } = useStatsAppNotices( undefined, { enabled: eligible } );

	if ( ! eligible || isError ) {
		return false;
	}

	return notices ? ! isDismissed( notices ) : undefined;
}

/**
 * Offers a paid Stats plan to a site on free Stats. Render it only where
 * `useFreeSiteUpgradeNoticeVisibility()` is true; a dismissal hides it through that hook.
 *
 * @return The notice.
 */
export function FreeSiteUpgradeNotice(): JSX.Element {
	const { createErrorNotice } = useDispatch( 'core/notices' );
	const { mutate: updateNotice } = useStatsAppNoticeMutation( {
		onError: () =>
			createErrorNotice(
				__( 'Couldn’t dismiss the notice. Please try again.', 'jetpack-premium-analytics-pkg' ),
				{ type: 'snackbar' }
			),
	} );
	const trackEvent = useTrackEvent();

	useEffect( () => {
		if ( viewedThisLoad ) {
			return;
		}

		viewedThisLoad = true;
		trackEvent( 'jetpack_premium_analytics_free_site_upgrade_notice_view' );
	}, [ trackEvent ] );

	const dismiss = useCallback( () => {
		updateNotice( { id: NOTICE_ID, status: 'postponed', postponed_for: POSTPONE_SECONDS } );
		trackEvent( 'jetpack_premium_analytics_free_site_upgrade_notice_dismiss' );
	}, [ updateNotice, trackEvent ] );

	const recordUpgradeClick = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_free_site_upgrade_notice_upgrade_click' );
	}, [ trackEvent ] );

	const recordLearnMoreClick = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_free_site_upgrade_notice_learn_more_click' );
	}, [ trackEvent ] );

	const hasStatsProduct = !! getScriptData()?.premium_analytics?.plan_gates?.has_stats_product;
	const upgradeHref = getPlanUpgradeUrl( 'jetpack-premium-analytics-free-site-upgrade-notice' );

	return (
		<Notice.Root intent="info" className={ styles.notice }>
			<Notice.Title>
				{ hasStatsProduct
					? __( 'Want to get the most out of Jetpack Stats?', 'jetpack-premium-analytics-pkg' )
					: __( 'Unlock more Stats with a paid plan', 'jetpack-premium-analytics-pkg' ) }
			</Notice.Title>
			<Notice.Description>
				{ __(
					'Jetpack Stats is free to keep using. A paid plan adds UTM stats, device stats, and region and city stats.',
					'jetpack-premium-analytics-pkg'
				) }
			</Notice.Description>

			<Notice.Actions>
				{ upgradeHref && (
					<Notice.ActionLink href={ upgradeHref } onClick={ recordUpgradeClick }>
						{ __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) }
					</Notice.ActionLink>
				) }
				<Notice.ActionLink href={ LEARN_MORE_URL } openInNewTab onClick={ recordLearnMoreClick }>
					{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
				</Notice.ActionLink>
			</Notice.Actions>

			<Notice.CloseIconButton
				label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
				onClick={ dismiss }
			/>
		</Notice.Root>
	);
}
