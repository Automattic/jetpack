import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import {
	QUERY_DISMISS_WELCOME_BANNER_KEY,
	REST_API_SITE_DISMISS_BANNER,
} from '../../data/constants';
import useSimpleMutation from '../use-simple-mutation';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';

const useWelcomeBanner = () => {
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();
	const [ isWelcomeBannerVisible, setIsWelcomeBannerVisible ] = useValueStore(
		'isWelcomeBannerVisible',
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
	}, [ handleDismissWelcomeBanner, setIsWelcomeBannerVisible ] );

	const showWelcomeBanner = useCallback( () => {
		setIsWelcomeBannerVisible( true );
	}, [ setIsWelcomeBannerVisible ] );

	return {
		dismissWelcomeBanner,
		showWelcomeBanner,
		isWelcomeBannerVisible,
	};
};

export default useWelcomeBanner;
