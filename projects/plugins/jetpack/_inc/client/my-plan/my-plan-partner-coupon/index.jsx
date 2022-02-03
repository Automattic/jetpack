/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import MyPlanBanner from '../my-plan-banner';
import { getPartnerCoupon } from 'state/initial-state';

const MyPlanPartnerCoupon = ( { siteAdminUrl, partnerCoupon } ) => {
	if ( ! partnerCoupon ) {
		return;
	}

	const redeemButton = (
		<Button primary href={ `${ siteAdminUrl }admin.php?page=jetpack&showCouponRedemption=1` }>
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
		/>
	);
};

MyPlanPartnerCoupon.propTypes = {
	partnerCoupon: PropTypes.object.isRequired,
	siteAdminUrl: PropTypes.string.isRequired,
};

export default connect( state => ( {
	partnerCoupon: getPartnerCoupon( state ),
} ) )( MyPlanPartnerCoupon );
