/**
 * External dependencies
 */
import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ActionButton, getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Import styles
 */
import './style.scss';

const PartnerCouponRedeem = props => {
	const {
		apiNonce,
		apiRoot,
		connectionStatus,
		partnerCoupon,
		assetBaseUrl,
		registrationNonce,
		siteRawUrl,
		tracksUserData,
		analytics,
	} = props;

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
	}, [ analytics, connectionStatus, partnerCoupon, tracksUserData ] );

	const partnerCouponHandleClick = useCallback( () => {
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
	}, [ analytics, connectionStatus, partnerCoupon, siteRawUrl, tracksUserData ] );

	const classes = classNames( 'jetpack-partner-coupon-redeem', {
		'jetpack-partner-coupon-redeem--connected': !! connectionStatus.hasConnectedOwner,
	} );

	return (
		<div className={ classes }>
			<ConnectScreen
				apiNonce={ apiNonce }
				registrationNonce={ registrationNonce }
				apiRoot={ apiRoot }
				images={ [ '/images/connect-right-partner-backup.png' ] }
				assetBaseUrl={ assetBaseUrl }
				from={ 'jetpack-partner-coupon' }
				title={ sprintf(
					/* translators: %s: Jetpack partner name. */
					__( 'Welcome to Jetpack %s traveler!', 'jetpack' ),
					partnerCoupon.partner.name
				) }
				buttonLabel={ sprintf(
					/* translators: %s: Name of a Jetpack product. */
					__( 'Set up & redeem %s', 'jetpack' ),
					partnerCoupon.product.title
				) }
				redirectUri={ `admin.php?page=jetpack&partnerCoupon=${ partnerCoupon.coupon_code }` }
				connectionStatus={ connectionStatus }
			>
				<p>
					{ sprintf(
						/* translators: %s: Name of a Jetpack product. */
						__( 'Redeem your coupon and get started with %s for free the first year!', 'jetpack' ),
						partnerCoupon.product.title
					) }
				</p>
				<ul>
					{ partnerCoupon.product.features.map( ( feature, key ) => (
						<li key={ key }>{ feature }</li>
					) ) }
				</ul>
				{ connectionStatus.hasConnectedOwner && (
					<ActionButton
						label={ sprintf(
							/* translators: %s: Name of a Jetpack product. */
							__( 'Redeem %s', 'jetpack' ),
							partnerCoupon.product.title
						) }
						onClick={ partnerCouponHandleClick }
					/>
				) }
			</ConnectScreen>
		</div>
	);
};

PartnerCouponRedeem.propTypes = {
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	assetBaseUrl: PropTypes.string.isRequired,
	connectionStatus: PropTypes.object.isRequired,
	partnerCoupon: PropTypes.object.isRequired,
	registrationNonce: PropTypes.string.isRequired,
	siteRawUrl: PropTypes.string.isRequired,
	tracksUserData: PropTypes.bool.isRequired,
	analytics: PropTypes.object,
};

export default PartnerCouponRedeem;
