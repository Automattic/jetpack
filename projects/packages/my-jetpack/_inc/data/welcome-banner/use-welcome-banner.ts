import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useEffect } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import {
	QUERY_DISMISS_WELCOME_BANNER_KEY,
	REST_API_SITE_DISMISS_BANNER,
	QUERY_RED_BUBBLE_ALERTS_KEY,
	REST_API_RED_BUBBLE_ALERTS,
} from '../../data/constants';
import useSimpleMutation from '../use-simple-mutation';
import useSimpleQuery from '../use-simple-query';
const useWelcomeBanner = () => {
	const {
		data: redBubbleAlerts,
		isLoading: isRedBubbleAlertsLoading,
		isError: isRedBubbleAlertsError,
	} = useSimpleQuery( {
		name: QUERY_RED_BUBBLE_ALERTS_KEY,
		query: { path: REST_API_RED_BUBBLE_ALERTS },
	} );

	const redBubbleAlertKeys = useMemo( () => {
		if ( isRedBubbleAlertsError || isRedBubbleAlertsLoading ) {
			return [];
		}

		return Object.keys( redBubbleAlerts );
	}, [ isRedBubbleAlertsError, isRedBubbleAlertsLoading, redBubbleAlerts ] );

	const [ isWelcomeBannerVisible, setIsWelcomeBannerVisible ] = useValueStore(
		'isWelcomeBannerVisible',
		redBubbleAlertKeys.includes( 'welcome-banner-active' )
	);

	useEffect( () => {
		if (
			! isRedBubbleAlertsLoading &&
			! isRedBubbleAlertsError &&
			redBubbleAlertKeys.includes( 'welcome-banner-active' )
		) {
			setIsWelcomeBannerVisible( true );
		}
	}, [
		isRedBubbleAlertsError,
		isRedBubbleAlertsLoading,
		redBubbleAlertKeys,
		setIsWelcomeBannerVisible,
	] );

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
