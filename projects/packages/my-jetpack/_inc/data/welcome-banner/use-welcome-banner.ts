import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
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

	const { mutate: handleDismissWelcomeBanner } = useSimpleMutation( {
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

	const dismissWelcomeBanner = useCallback( () => {
		handleDismissWelcomeBanner( null, { onSuccess: () => setIsWelcomeBannerVisible( false ) } );
	}, [ handleDismissWelcomeBanner ] );

	return {
		dismissWelcomeBanner,
		isWelcomeBannerVisible,
	};
};

export default useWelcomeBanner;
