/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ActionButton, getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getConnectionStatus } from 'state/connection';
import {
	getApiNonce,
	getApiRootUrl,
	getPartnerCoupon,
	getPluginBaseUrl,
	getRegistrationNonce,
	getSiteRawUrl,
} from 'state/initial-state';

const PartnerCouponRedeem = props => {
	const {
		apiNonce,
		apiRoot,
		connectionStatus,
		partnerCoupon,
		pluginBaseUrl,
		registrationNonce,
		siteRawUrl,
	} = props;

	const partnerCouponHandleClick = useCallback( () => {
		window.location.href = getRedirectUrl( 'jetpack-plugin-partner-coupon-checkout', {
			path: partnerCoupon.product.slug,
			site: siteRawUrl,
			query: `coupon=${ partnerCoupon.coupon_code }`,
		} );
	}, [ partnerCoupon, siteRawUrl ] );

	return (
		<ConnectScreen
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			apiRoot={ apiRoot }
			images={ [ '/images/products/illustration-backup.png' ] }
			assetBaseUrl={ pluginBaseUrl }
			title={ sprintf(
				/* translators: %s: Jetpack partner name. */
				__( 'Welcome to Jetpack %s traveler!', 'jetpack' ),
				partnerCoupon.partner
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
					<li className="jp-recommendations-product-purchased__feature" key={ key }>
						{ feature }
					</li>
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
};

export default connect( state => ( {
	apiRoot: getApiRootUrl( state ),
	apiNonce: getApiNonce( state ),
	connectionStatus: getConnectionStatus( state ),
	partnerCoupon: getPartnerCoupon( state ),
	pluginBaseUrl: getPluginBaseUrl( state ),
	registrationNonce: getRegistrationNonce( state ),
	siteRawUrl: getSiteRawUrl( state ),
} ) )( PartnerCouponRedeem );
