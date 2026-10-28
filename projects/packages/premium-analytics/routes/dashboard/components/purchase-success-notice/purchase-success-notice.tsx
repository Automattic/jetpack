/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { AnalyticsQueryClientProvider, useSiteIsCommercial } from '@jetpack-premium-analytics/data';
import { Link, Notice } from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { speak } from '@wordpress/a11y';
import { createInterpolateElement, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { usePlanUpgradeLinkProps } from '../stats-settings/plan-usage';
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
 * Reads the returned purchase and renders the notice for it.
 *
 * @return The notice, or nothing.
 */
function ConnectedNotice(): JSX.Element | null {
	const purchase = getScriptData()?.premium_analytics?.purchase_success;
	const isPaid = purchase?.type === 'paid';
	const [ isDismissed, setIsDismissed ] = useState( isDismissedThisLoad );
	const { data: isCommercial, isPending } = useSiteIsCommercial( { enabled: isPaid } );
	const trackEvent = useTrackEvent();
	const upgradeLink = usePlanUpgradeLinkProps( 'jetpack-free-stats-purchase-success-notice' );

	useEffect( removePurchaseSuccessParam, [] );

	const dismiss = useCallback( () => {
		isDismissedThisLoad = true;
		setIsDismissed( true );
	}, [] );

	const recordUpgradeClick = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_purchase_success_notice_upgrade_click' );
	}, [ trackEvent ] );

	// The paid copy depends on the classification, so wait rather than swap a line under the reader.
	const isVisible = !! purchase && ! isDismissed && ! ( isPaid && isPending );
	const title = isPaid
		? __( 'Thank you for supporting Jetpack Stats!', 'jetpack-premium-analytics-pkg' )
		: __( 'Thank you for using Jetpack Stats!', 'jetpack-premium-analytics-pkg' );

	useEffect( () => {
		if ( isVisible ) {
			speak( title, 'polite' );
		}
	}, [ isVisible, title ] );

	if ( ! isVisible ) {
		return null;
	}

	let description: string | JSX.Element;
	if ( isPaid ) {
		description = isCommercial
			? __(
					'You’ll now get instant access to upcoming features and priority support.',
					'jetpack-premium-analytics-pkg'
				)
			: __(
					'You’ll stop seeing the upgrade banners and get Email support if applicable.',
					'jetpack-premium-analytics-pkg'
				);
	} else {
		description = createInterpolateElement(
			__(
				'We appreciate your continued support. If you want to access upcoming features, <link>please consider upgrading</link>.',
				'jetpack-premium-analytics-pkg'
			),
			{
				link: upgradeLink ? <Link { ...upgradeLink } onClick={ recordUpgradeClick } /> : <span />,
			}
		);
	}

	return (
		<Notice.Root intent="success" className={ styles.notice }>
			<Notice.Title>{ title }</Notice.Title>
			<Notice.Description>{ description }</Notice.Description>
			<Notice.CloseIconButton
				label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
				onClick={ dismiss }
			/>
		</Notice.Root>
	);
}

/**
 * Thanks the reader for the Stats plan they just bought or picked, with the copy Stats shows.
 * Brings its own query provider, since the dashboard stage has none.
 *
 * @return The notice, or nothing.
 */
export function PurchaseSuccessNotice(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<ConnectedNotice />
		</AnalyticsQueryClientProvider>
	);
}
