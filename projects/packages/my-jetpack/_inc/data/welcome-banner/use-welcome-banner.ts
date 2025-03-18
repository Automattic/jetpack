import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useEffect } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import {
	QUERY_DISMISS_WELCOME_BANNER_KEY,
	REST_API_SITE_DISMISS_BANNER,
} from '../../data/constants';
import useRedBubbleQuery from '../use-red-bubble-query';
import useSimpleMutation from '../use-simple-mutation';

const useWelcomeBanner = () => {
	const {
		data: redBubbleAlerts,
		isLoading: isRedBubbleAlertsLoading,
		isError: isRedBubbleAlertsError,
		refetch: refetchRedBubbleAlerts,
	} = useRedBubbleQuery();

	const redBubbleAlertKeys = useMemo( () => {
		if ( isRedBubbleAlertsError || isRedBubbleAlertsLoading ) {
			return [];
		}

		return Object.keys( redBubbleAlerts );
	}, [ isRedBubbleAlertsError, isRedBubbleAlertsLoading, redBubbleAlerts ] );

	const [ isDismissing, setIsDismissing ] = useValueStore( 'isDismissingWelcomeBanner', false );
	const [ isWelcomeBannerVisible, setIsWelcomeBannerVisible ] = useValueStore(
		'isWelcomeBannerVisible',
		redBubbleAlertKeys.includes( 'welcome-banner-active' )
	);

	useEffect( () => {
		if ( isDismissing ) {
			setIsWelcomeBannerVisible( false );
			return;
		}

		if ( redBubbleAlertKeys.includes( 'welcome-banner-active' ) ) {
			setIsWelcomeBannerVisible( true );
		}
	}, [ isDismissing, redBubbleAlertKeys, setIsWelcomeBannerVisible ] );

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
		setIsDismissing( true );
		handleDismissWelcomeBanner( null, {
			onSuccess: async () => {
				await refetchRedBubbleAlerts();
				setIsDismissing( false );
			},
		} );
	}, [ handleDismissWelcomeBanner, refetchRedBubbleAlerts, setIsDismissing ] );

	const showWelcomeBanner = useCallback( () => {
		setIsDismissing( false );
		setIsWelcomeBannerVisible( true );
	}, [ setIsWelcomeBannerVisible, setIsDismissing ] );

	return {
		dismissWelcomeBanner,
		showWelcomeBanner,
		isWelcomeBannerVisible,
	};
};

export default useWelcomeBanner;
