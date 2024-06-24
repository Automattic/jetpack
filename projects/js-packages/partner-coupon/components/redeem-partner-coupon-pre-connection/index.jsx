import { ActionButton } from '@automattic/jetpack-components';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { usePartnerCouponRedemption } from '../../hooks.js';

/**
 * Import styles
 */
import './style.scss';

const RedeemPartnerCouponPreConnection = props => {
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

	const onClick = usePartnerCouponRedemption(
		partnerCoupon,
		siteRawUrl,
		connectionStatus,
		tracksUserData,
		analytics
	);

	const classes = clsx( 'jetpack-redeem-partner-coupon-pre-connection', {
		'jetpack-redeem-partner-coupon-pre-connection--connected':
			!! connectionStatus.hasConnectedOwner,
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
						onClick={ onClick }
					/>
				) }
			</ConnectScreen>
		</div>
	);
};

RedeemPartnerCouponPreConnection.propTypes = {
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

export default RedeemPartnerCouponPreConnection;
