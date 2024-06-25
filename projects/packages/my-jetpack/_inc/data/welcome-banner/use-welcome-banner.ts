import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import {
	QUERY_DISMISS_WELCOME_BANNER_KEY,
	REST_API_SITE_DISMISS_BANNER,
} from '../../data/constants';
import useSimpleMutation from '../use-simple-mutation';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';

const useWelcomeBanner = () => {
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();
	const [ isWelcomeBannerVisible, setIsWelcomeBannerVisible ] = useState(
		Object.keys( redBubbleAlerts ).includes( 'welcome-banner-active' )
	);

	const { mutate: dismissWelcomeBanner } = useSimpleMutation( {
		name: QUERY_DISMISS_WELCOME_BANNER_KEY,
		query: {
			path: REST_API_SITE_DISMISS_BANNER,
			method: 'POST',
		},
		errorMessage: __(
			'Failed to dismiss the welcome banner. Please try again',
			'jetpack-my-jetpack'
		),
	} );

	return {
		dismissWelcomeBanner: () =>
			dismissWelcomeBanner( null, { onSuccess: () => setIsWelcomeBannerVisible( false ) } ),
		isWelcomeBannerVisible,
	};
};

export default useWelcomeBanner;
