import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useEffect } from 'react';

// Get user data from the inial state
const tracksUserData = window?.Jetpack_Editor_Initial_State?.tracksUserData || {};

const useAnalytics = () => {
	/**
	 * Initialize tracks with user data.
	 */
	useEffect( () => {
		if ( tracksUserData?.userid && tracksUserData?.username ) {
			jetpackAnalytics.initialize( tracksUserData.userid, tracksUserData?.username );
		}
	}, [] );

	return jetpackAnalytics;
};

export default useAnalytics;
