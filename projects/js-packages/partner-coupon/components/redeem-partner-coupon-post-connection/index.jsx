/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { ActionButton, JetpackLogo } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Import styles
 */
import './style.scss';
import { usePartnerCouponRedemption } from '../../hooks';

const RedeemPartnerCouponPostConnection = props => {
	const {
		connectionStatus,
		partnerCoupon,
		assetBaseUrl,
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

	let logoComponent = null;

	if ( partnerCoupon.partner.logo ) {
		logoComponent = (
			<>
				<JetpackLogo />
				<span>+</span>
				<img
					src={ `${ assetBaseUrl }${ partnerCoupon.partner.logo.src }` }
					alt=""
					width={ partnerCoupon.partner.logo.width }
					height={ partnerCoupon.partner.logo.height }
				/>
			</>
		);
	} else {
		logoComponent = <JetpackLogo />;
	}

	return (
		<div className="jetpack-redeem-partner-coupon-post-connection">
			<div className="jetpack-redeem-partner-coupon-post-connection__layout">
				<div className="jetpack-redeem-partner-coupon-post-connection__content">
					<div className="jetpack-redeem-partner-coupon-post-connection__logo">
						{ logoComponent }
					</div>

					<h2 className="jetpack-redeem-partner-coupon-post-connection__heading">
						{ __( 'One free year of Jetpack Backup', 'jetpack' ) }
					</h2>

					<p>
						{ sprintf(
							/* translators: %s: Name of a Jetpack product. */
							__(
								'Redeem your coupon and get started with %s for free the first year! Never worry about losing your data, ever.',
								'jetpack'
							),
							partnerCoupon.product.title
						) }
					</p>

					<ul>
						{ partnerCoupon.product.features.map( ( feature, key ) => (
							<li key={ key }>{ feature }</li>
						) ) }
					</ul>

					<ActionButton
						label={ sprintf(
							/* translators: %s: Name of a Jetpack product. */
							__( 'Redeem %s', 'jetpack' ),
							partnerCoupon.product.title
						) }
						onClick={ onClick }
					/>
				</div>
				<div
					className="jetpack-redeem-partner-coupon-post-connection__aside"
					style={ {
						backgroundImage: `url(${ assetBaseUrl }/images/jetpack-aside-background.jpg)`,
					} }
				>
					<img src={ assetBaseUrl + '/images/cloud-checkmark.svg' } alt="" />
				</div>
			</div>
		</div>
	);
};

RedeemPartnerCouponPostConnection.propTypes = {
	assetBaseUrl: PropTypes.string.isRequired,
	connectionStatus: PropTypes.object.isRequired,
	partnerCoupon: PropTypes.object.isRequired,
	siteRawUrl: PropTypes.string.isRequired,
	tracksUserData: PropTypes.bool.isRequired,
	analytics: PropTypes.object,
};

export default RedeemPartnerCouponPostConnection;
