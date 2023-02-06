import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { getPartnerCoupon } from 'state/initial-state';
import MyPlanBanner from '../my-plan-banner';

const MyPlanPartnerCoupon = ( { partnerCoupon, siteRawUrl } ) => {
	if ( 'object' !== typeof partnerCoupon ) {
		return null;
	}

	const redeemButton = (
		<Button
			primary
			href={ getRedirectUrl( 'jetpack-plugin-partner-coupon-checkout', {
				path: partnerCoupon.product.slug,
				site: siteRawUrl,
				query: `coupon=${ partnerCoupon.coupon_code }`,
			} ) }
		>
			{ __( 'Redeem', 'jetpack' ) }
		</Button>
	);

	return (
		<MyPlanBanner
			productSlug={ partnerCoupon.product.slug }
			action={ redeemButton }
			title={ sprintf(
				/* translators: %s: Jetpack product or plan name. */
				__( 'Get %s free for one year!', 'jetpack' ),
				partnerCoupon.product.title
			) }
			tagLine={ sprintf(
				/* translators: %1$s: the name of a Jetpack partner, %2$s: the name of a Jetpack product or plan. */
				__(
					'Redeem your %1$s coupon to get started with %2$s for free the first year!',
					'jetpack'
				),
				partnerCoupon.partner.name,
				partnerCoupon.product.title
			) }
			trackingId="jetpack-partner-coupon"
			additionalEventProperties={ {
				coupon: partnerCoupon.coupon_code,
			} }
		/>
	);
};

MyPlanPartnerCoupon.propTypes = {
	partnerCoupon: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ).isRequired,
	siteRawUrl: PropTypes.string.isRequired,
};

export default connect( state => ( {
	partnerCoupon: getPartnerCoupon( state ),
} ) )( MyPlanPartnerCoupon );
