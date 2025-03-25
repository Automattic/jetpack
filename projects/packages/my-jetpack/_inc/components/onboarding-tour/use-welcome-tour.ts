import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import {
	QUERY_DISMISS_WELCOME_TOUR_KEY,
	REST_API_SITE_DISMISS_WELCOME_TOUR,
} from '../../data/constants';
import useSimpleMutation from '../../data/use-simple-mutation';

const useWelcomeTour = () => {
	const [ isDismissing, setIsDismissing ] = useValueStore( 'isDismissingWelcomeTour', false );
	const [ isWelcomeTourVisible, setIsWelcomeTourVisible ] = useValueStore(
		'isWelcomeTourVisible',
		Boolean( window?.myJetpackInitialState?.isWelcomeTourActive ) || false
	);

	useEffect( () => {
		if ( isDismissing ) {
			setIsWelcomeTourVisible( false );
		}
	}, [ isDismissing, setIsWelcomeTourVisible ] );

	const { mutate: handleDismissWelcomeTour } = useSimpleMutation( {
		name: QUERY_DISMISS_WELCOME_TOUR_KEY,
		query: {
			path: REST_API_SITE_DISMISS_WELCOME_TOUR,
			method: 'POST',
		},
		errorMessage: __(
			'Failed to dismiss the welcome tour. Please try again',
			'jetpack-my-jetpack'
		),
	} );

	const dismissWelcomeTour = useCallback( () => {
		setIsDismissing( true );
		handleDismissWelcomeTour( null, {
			onSuccess: async () => {
				setIsDismissing( false );
			},
		} );
	}, [ handleDismissWelcomeTour, setIsDismissing ] );

	const showWelcomeTour = useCallback( () => {
		setIsDismissing( false );
		setIsWelcomeTourVisible( true );
	}, [ setIsWelcomeTourVisible, setIsDismissing ] );

	return {
		dismissWelcomeTour,
		showWelcomeTour,
		isWelcomeTourVisible,
	};
};

export default useWelcomeTour;
