import PropTypes from 'prop-types';
import React from 'react';
import RedeemPartnerCouponPostConnection from '../redeem-partner-coupon-post-connection';
import RedeemPartnerCouponPreConnection from '../redeem-partner-coupon-pre-connection';

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

	if ( connectionStatus.hasConnectedOwner ) {
		return (
			<RedeemPartnerCouponPostConnection
				assetBaseUrl={ assetBaseUrl }
				connectionStatus={ connectionStatus }
				partnerCoupon={ partnerCoupon }
				siteRawUrl={ siteRawUrl }
				tracksUserData={ !! tracksUserData }
				analytics={ analytics }
			/>
		);
	}

	return (
		<RedeemPartnerCouponPreConnection
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			apiRoot={ apiRoot }
			assetBaseUrl={ assetBaseUrl }
			connectionStatus={ connectionStatus }
			partnerCoupon={ partnerCoupon }
			siteRawUrl={ siteRawUrl }
			tracksUserData={ !! tracksUserData }
			analytics={ analytics }
		/>
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
