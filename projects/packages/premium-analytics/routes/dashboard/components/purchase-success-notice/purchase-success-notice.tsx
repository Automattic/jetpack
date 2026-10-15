/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { Link, Notice } from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { createInterpolateElement, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getPlanUpgradeUrl } from '../stats-settings/plan-usage';
import styles from './purchase-success-notice.module.scss';
import type { JSX } from 'react';

const PURCHASE_SUCCESS_PARAM = 'statsPurchaseSuccess';

// Module-level for the same reason as PlanLimitNotice's `viewedThisLoad`.
let isDismissedThisLoad = false;

/**
 * Reset the once-per-load dismissal. Test-only.
 */
export function resetPurchaseSuccessNoticeForTesting() {
	isDismissedThisLoad = false;
}

/**
 * Whether this page load returned from a Stats checkout.
 *
 * @return True when the server reported a purchase for this load.
 */
export function hasPurchaseSuccess(): boolean {
	return !! getScriptData()?.premium_analytics?.purchase_success;
}

/**
 * Drop the checkout's flag from the address, so a reload doesn't thank the reader again.
 */
function removePurchaseSuccessParam() {
	const url = new URL( window.location.href );
	if ( ! url.searchParams.has( PURCHASE_SUCCESS_PARAM ) ) {
		return;
	}

	url.searchParams.delete( PURCHASE_SUCCESS_PARAM );
	window.history.replaceState( window.history.state, '', url );
}

/**
 * Thanks the reader for the Stats plan they just bought or picked, with the copy Stats shows.
 *
 * @return The notice, or nothing.
 */
export function PurchaseSuccessNotice(): JSX.Element | null {
	const purchase = getScriptData()?.premium_analytics?.purchase_success;
	const [ isDismissed, setIsDismissed ] = useState( isDismissedThisLoad );
	const trackEvent = useTrackEvent();

	useEffect( removePurchaseSuccessParam, [] );

	const dismiss = useCallback( () => {
		isDismissedThisLoad = true;
		setIsDismissed( true );
	}, [] );

	const recordUpgradeClick = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_purchase_success_notice_upgrade_click' );
	}, [ trackEvent ] );

	if ( ! purchase || isDismissed ) {
		return null;
	}

	let title: string;
	let description: string | JSX.Element;
	if ( purchase.type === 'paid' ) {
		title = __( 'Thank you for supporting Jetpack Stats!', 'jetpack-premium-analytics-pkg' );
		description = purchase.is_commercial
			? __(
					'You’ll now get instant access to upcoming features and priority support.',
					'jetpack-premium-analytics-pkg'
				)
			: __(
					'You’ll stop seeing the upgrade banners and get Email support if applicable.',
					'jetpack-premium-analytics-pkg'
				);
	} else {
		const upgradeHref = getPlanUpgradeUrl( 'jetpack-free-stats-purchase-success-notice' );
		title = __( 'Thank you for using Jetpack Stats!', 'jetpack-premium-analytics-pkg' );
		description = createInterpolateElement(
			__(
				'We appreciate your continued support. If you want to access upcoming features, <link>please consider upgrading</link>.',
				'jetpack-premium-analytics-pkg'
			),
			{
				link: upgradeHref ? <Link href={ upgradeHref } onClick={ recordUpgradeClick } /> : <span />,
			}
		);
	}

	return (
		<Notice.Root intent="success" className={ styles.notice }>
			<Notice.Title>{ title }</Notice.Title>
			<Notice.Description>{ description }</Notice.Description>
			<Notice.CloseIcon
				label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
				onClick={ dismiss }
			/>
		</Notice.Root>
	);
}
