import { ActionButton, JetpackLogo } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { usePartnerCouponRedemption } from '../../hooks.js';

/**
 * Import styles
 */
import './style.scss';

export const DISMISS_LS_ITEM_NAME = 'jetpackRedeemPartnerCouponDismissedAt';
export const DISMISS_LS_ITEM_MAX_AGE = 3 * 24 * 60 * 60; // 3 days

/**
 * Is partner coupon redeem CTA dismissed?
 *
 * @returns {boolean} Is the redeem CTA dismissed?
 */
function isDismissed() {
	const dismissedAt = localStorage.getItem( DISMISS_LS_ITEM_NAME );

	if (
		! dismissedAt ||
		new Date().getTime() > parseInt( dismissedAt ) + DISMISS_LS_ITEM_MAX_AGE * 1000
	) {
		return false;
	}

	return true;
}

/**
 * Dismiss partner coupon redeem CTA.
 *
 * @returns {void}
 */
function dismiss() {
	localStorage.setItem( DISMISS_LS_ITEM_NAME, new Date().getTime() );
}

const RedeemPartnerCouponPostConnection = props => {
	const {
		connectionStatus,
		partnerCoupon,
		assetBaseUrl,
		siteRawUrl,
		tracksUserData,
		analytics,
	} = props;
	const [ dismissed, setDismissed ] = useState( isDismissed() );

	const onClick = usePartnerCouponRedemption(
		partnerCoupon,
		siteRawUrl,
		connectionStatus,
		tracksUserData,
		analytics
	);

	const onRemindMeLater = useCallback( () => {
		dismiss();
		setDismissed( isDismissed() );
	}, [ setDismissed ] );

	if ( dismissed ) {
		return null;
	}

	let logoComponent = null;

	if ( partnerCoupon.partner.logo ) {
		logoComponent = (
			<>
				<JetpackLogo />
				<span>+</span>
				<img
					src={ `${ assetBaseUrl }${ partnerCoupon.partner.logo.src }` }
					alt={ sprintf(
						/* translators: %s: Name of Jetpack partner. */
						__( 'Logo of %s who are offering a coupon in partnership with Jetpack', 'jetpack' ),
						partnerCoupon.partner.name
					) }
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
				</div>
				<div
					className="jetpack-redeem-partner-coupon-post-connection__aside"
					style={ {
						backgroundImage: `url(${ assetBaseUrl }/images/jetpack-aside-background.jpg)`,
					} }
				>
					<img src={ assetBaseUrl + '/images/cloud-checkmark.svg' } alt="" />
				</div>
				<div className="jetpack-redeem-partner-coupon-post-connection__subcontent">
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

					<div className="jetpack-redeem-partner-coupon-post-connection__actions">
						<div>
							<ActionButton
								label={ sprintf(
									/* translators: %s: Name of a Jetpack product. */
									__( 'Redeem %s', 'jetpack' ),
									partnerCoupon.product.title
								) }
								onClick={ onClick }
							/>
						</div>
						<div>
							<button
								className="jetpack-redeem-partner-coupon-post-connection__remind-me-later"
								onClick={ onRemindMeLater }
							>
								{ __( 'Remind me later', 'jetpack' ) }
							</button>
						</div>
					</div>
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
