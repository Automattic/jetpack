import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useConnection } from '@automattic/jetpack-connection';
import { useEffect } from '@wordpress/element';

const useAnalytics = () => {
	const { isUserConnected, userConnectionData = {} } = useConnection();
	const { wpcomUser: { login, ID } = {}, blogId } = userConnectionData.currentUser || {};

	/**
	 * Initialize tracks with user and blog data.
	 * This will only work if the user is connected.
	 */
	useEffect( () => {
		if ( ! isUserConnected || ! ID || ! login || ! blogId ) {
			return;
		}

		jetpackAnalytics.initialize( ID, login, {
			blog_id: blogId,
		} );
	}, [ blogId, ID, login, isUserConnected ] );

	return jetpackAnalytics;
};

export default useAnalytics;
