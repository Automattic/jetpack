/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	useStatsAppNoticeMutation,
	useStatsAppNotices,
	type StatsAppNotices,
} from '@jetpack-premium-analytics/data';
import { Notice } from '@jetpack-premium-analytics/externals';
import {
	useStatsUpgradeLinkProps,
	useTrackEvent,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './free-site-upgrade-notice.module.scss';
import type { JSX } from 'react';

const NOTICE_ID = 'free_site_upgrade';

// Stats postpones this notice for ten years, so a dismissal is final.
const POSTPONE_SECONDS = 3650 * 24 * 60 * 60;

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
 * Whether Stats lets the banner show: WordPress.com reports it visible until it is dismissed,
 * so a missing key means the dismissal state could not be read.
 *
 * @param notices - The Stats notice visibility state.
 * @return Whether the banner may show.
 */
function isVisible( notices: StatsAppNotices ): boolean {
	return (
		notices[ NOTICE_ID ] === true && REPLACED_NOTICE_IDS.every( id => notices[ id ] !== false )
	);
}

/**
 * Whether the free site upgrade banner shows.
 *
 * @return `undefined` while the dismissal state loads, otherwise whether it shows.
 */
export function useFreeSiteUpgradeNoticeVisibility(): boolean | undefined {
	const eligible = !! getScriptData()?.premium_analytics?.plan_gates?.free_site_upgrade;
	const { data: notices, isError } = useStatsAppNotices( undefined, { enabled: eligible } );

	if ( ! eligible ) {
		return false;
	}

	// A failed refetch keeps the cached notices, so they still decide.
	if ( notices ) {
		return isVisible( notices );
	}

	return isError ? false : undefined;
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

	const offer = getScriptData()?.premium_analytics?.plan_gates?.free_site_upgrade;
	const hasStatsProduct = !! offer?.has_stats_product;
	const upgradeLink = useStatsUpgradeLinkProps(
		'jetpack-premium-analytics-free-site-upgrade-notice',
		offer?.upgrade_url
	);

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
				{ upgradeLink && (
					<Notice.ActionLink { ...upgradeLink } onClick={ recordUpgradeClick }>
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
