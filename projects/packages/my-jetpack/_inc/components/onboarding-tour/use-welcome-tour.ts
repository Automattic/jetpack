import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import {
	QUERY_UPDATE_WELCOME_TOUR_STATUS_KEY,
	REST_API_SITE_UPDATE_WELCOME_TOUR_STATUS,
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

	// enable or disable the tour
	// enable - based on URL parameter to handle navigating away without interacting with the tour
	// disable - when the user dismisses or finishes the tour
	const { mutate: handleUpdateWelcomeTourStatus } = useSimpleMutation( {
		name: QUERY_UPDATE_WELCOME_TOUR_STATUS_KEY,
		query: {
			path: REST_API_SITE_UPDATE_WELCOME_TOUR_STATUS,
			method: 'POST',
		},
		errorMessage: __(
			'Failed to update the welcome tour status. Please try again',
			'jetpack-my-jetpack'
		),
	} );

	const dismissWelcomeTour = useCallback( () => {
		setIsDismissing( true );

		handleUpdateWelcomeTourStatus(
			{
				data: { enable: false },
			},
			{
				onSuccess: async () => {
					setIsDismissing( false );
				},
			}
		);
	}, [ handleUpdateWelcomeTourStatus, setIsDismissing ] );

	const showWelcomeTour = useCallback( () => {
		setIsDismissing( false );
		setIsWelcomeTourVisible( true );
	}, [ setIsWelcomeTourVisible, setIsDismissing ] );

	const enableWelcomeTour = useCallback( () => {
		// show the tour
		setIsWelcomeTourVisible( true );
		// enable the tour
		handleUpdateWelcomeTourStatus( {
			data: { enable: true },
		} );
	}, [ setIsWelcomeTourVisible, handleUpdateWelcomeTourStatus ] );

	return {
		dismissWelcomeTour,
		enableWelcomeTour,
		showWelcomeTour,
		isWelcomeTourVisible,
	};
};

export default useWelcomeTour;
