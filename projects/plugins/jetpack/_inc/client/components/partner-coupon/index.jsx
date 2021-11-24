/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ActionButton, getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getConnectionStatus } from 'state/connection';
import {
	getApiNonce,
	getApiRootUrl,
	getPartnerCoupon,
	getPluginBaseUrl,
	getRegistrationNonce,
	getSiteRawUrl,
	getTracksUserData,
} from 'state/initial-state';

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
		pluginBaseUrl,
		registrationNonce,
		siteRawUrl,
		tracksUserData,
	} = props;

	useEffect( () => {
		if ( tracksUserData ) {
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
	}, [ connectionStatus, partnerCoupon, tracksUserData ] );

	const partnerCouponHandleClick = useCallback( () => {
		if ( tracksUserData ) {
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
	}, [ connectionStatus, partnerCoupon, siteRawUrl, tracksUserData ] );

	return (
		<div className="jetpack-partner-coupon-redeem">
			<ConnectScreen
				apiNonce={ apiNonce }
				registrationNonce={ registrationNonce }
				apiRoot={ apiRoot }
				images={ [ '/images/connect-right-partner-backup.png' ] }
				assetBaseUrl={ pluginBaseUrl }
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
	// From connect HoC.
	apiRoot: PropTypes.string,
	apiNonce: PropTypes.string,
	connectionStatus: PropTypes.object,
	partnerCoupon: PropTypes.object,
	pluginBaseUrl: PropTypes.string,
	registrationNonce: PropTypes.string,
	siteRawUrl: PropTypes.string,
	tracksUserData: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ),
};

export default connect( state => ( {
	apiRoot: getApiRootUrl( state ),
	apiNonce: getApiNonce( state ),
	connectionStatus: getConnectionStatus( state ),
	partnerCoupon: getPartnerCoupon( state ),
	pluginBaseUrl: getPluginBaseUrl( state ),
	registrationNonce: getRegistrationNonce( state ),
	siteRawUrl: getSiteRawUrl( state ),
	tracksUserData: getTracksUserData( state ),
} ) )( PartnerCouponRedeem );
