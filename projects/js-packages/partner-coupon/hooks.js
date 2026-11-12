import { getRedirectUrl } from '@automattic/jetpack-components';
import { useCallback, useEffect } from 'react';
import { assignLocation } from './utils/assignLocation.js';

/**
 * Handle partner coupon redeem analytics and clicks.
 *
 * @param {object}  partnerCoupon    - Partner coupon details.
 * @param {string}  siteRawUrl       - Site's raw URL.
 * @param {object}  connectionStatus - Connection status.
 * @param {boolean} tracksUserData   - Should we track user data.
 * @param {object}  analytics        - Analytics.
 * @return {Function} Click handler for coupon redemption.
 */
export function usePartnerCouponRedemption(
	partnerCoupon,
	siteRawUrl,
	connectionStatus,
	tracksUserData,
	analytics
) {
	const {
		coupon_code: couponCode,
		preset,
		partner: { prefix: partnerPrefix },
	} = partnerCoupon;
	const connected = connectionStatus.isRegistered ? 'yes' : 'no';

	useEffect( () => {
		if ( tracksUserData && 'object' === typeof analytics ) {
			analytics.tracks.recordEvent( 'jetpack_partner_coupon_redeem_view', {
				coupon: couponCode,
				partner: partnerPrefix,
				preset,
				// This is expected to always be "yes" since we do not track users
				// before they have connected and agreed to our ToS, but we'll leave
				// it in for historical reasons if this change some day.
				connected,
			} );
		}
	}, [ analytics, tracksUserData, couponCode, partnerPrefix, preset, connected ] );

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

		assignLocation(
			getRedirectUrl( 'jetpack-plugin-partner-coupon-checkout', {
				path: partnerCoupon.product.slug,
				site: siteRawUrl,
				query: `coupon=${ partnerCoupon.coupon_code }`,
			} )
		);
	}, [ analytics, tracksUserData, connectionStatus, partnerCoupon, siteRawUrl ] );

	return onClick;
}
