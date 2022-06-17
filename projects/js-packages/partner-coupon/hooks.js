import { getRedirectUrl } from '@automattic/jetpack-components';
import { useCallback, useEffect } from 'react';

/**
 * Handle partner coupon redeem analytics and clicks.
 *
 * @param {object} partnerCoupon - Partner coupon details.
 * @param {string} siteRawUrl - Site's raw URL.
 * @param {object} connectionStatus - Connection status.
 * @param {boolean} tracksUserData - Should we track user data.
 * @param {object} analytics - Analytics.
 * @returns {Function} Click handler for coupon redemption.
 */
export function usePartnerCouponRedemption(
	partnerCoupon,
	siteRawUrl,
	connectionStatus,
	tracksUserData,
	analytics
) {
	useEffect( () => {
		if ( tracksUserData && 'object' === typeof analytics ) {
			analytics.tracks.recordEvent( 'jetpack_partner_coupon_redeem_view', {
				coupon: partnerCoupon.coupon_code,
				partner: partnerCoupon.partner.prefix,
				preset: partnerCoupon.preset,
				// This is expected to always be "yes" since we do not track users
				// before they have connected and agreed to our ToS, but we'll leave
				// it in for historical reasons if this change some day.
				connected: connectionStatus.isRegistered ? 'yes' : 'no',
			} );
		}
	}, [ analytics, tracksUserData, connectionStatus, partnerCoupon ] );

	const onClick = useCallback( () => {
		if ( tracksUserData && 'object' === typeof analytics ) {
			analytics.tracks.recordEvent( 'jetpack_partner_coupon_redeem_click', {
				coupon: partnerCoupon.coupon_code,
				partner: partnerCoupon.partner.prefix,
				preset: partnerCoupon.preset,
				// This is expected to always be "yes" since we do not track users
				// before they have connected and agreed to our ToS, but we'll leave
				// it in for historical reasons if this change some day.
				connected: connectionStatus.isRegistered ? 'yes' : 'no',
			} );
		}

		window.location.href = getRedirectUrl( 'jetpack-plugin-partner-coupon-checkout', {
			path: partnerCoupon.product.slug,
			site: siteRawUrl,
			query: `coupon=${ partnerCoupon.coupon_code }`,
		} );
	}, [ analytics, tracksUserData, connectionStatus, partnerCoupon, siteRawUrl ] );

	return onClick;
}
