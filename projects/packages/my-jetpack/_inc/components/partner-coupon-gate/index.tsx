import jetpackAnalytics from '@automattic/jetpack-analytics';
import { PartnerCouponRedeem, isPartnerCouponDismissed } from '@automattic/jetpack-partner-coupon';
import { useCallback, useLayoutEffect, useState } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import type { FC, ReactNode } from 'react';

// Shows the partner coupon screen in place of the dashboard while PHP says it applies.
const PartnerCouponGate: FC< { children: ReactNode } > = ( { children } ) => {
	const { partnerCoupon, siteSuffix } = getMyJetpackWindowInitialState();
	const connection = useMyJetpackConnection();
	const { hasConnectedOwner, isUserConnected, userConnectionData } = connection;
	const { ID, login } = userConnectionData?.currentUser?.wpcomUser ?? {};
	const [ remindLater, setRemindLater ] = useState(
		() => !! hasConnectedOwner && isPartnerCouponDismissed()
	);
	const onRemindMeLater = useCallback( () => setRemindLater( true ), [] );

	// Layout effects run before the screen's view event (a passive effect), so it is attributed.
	useLayoutEffect( () => {
		if ( partnerCoupon && isUserConnected && ID && login ) {
			jetpackAnalytics.initialize( ID, login );
		}
	}, [ partnerCoupon, isUserConnected, ID, login ] );

	if ( ! partnerCoupon || remindLater ) {
		return <>{ children }</>;
	}

	return (
		<PartnerCouponRedeem
			apiNonce={ connection.apiNonce }
			apiRoot={ connection.apiRoot }
			registrationNonce=""
			assetBaseUrl={ partnerCoupon.assetBaseUrl }
			connectionStatus={ connection }
			partnerCoupon={ partnerCoupon.coupon }
			siteRawUrl={ siteSuffix }
			tracksUserData={ !! isUserConnected }
			analytics={ jetpackAnalytics }
			onRemindMeLater={ onRemindMeLater }
		/>
	);
};

export default PartnerCouponGate;
