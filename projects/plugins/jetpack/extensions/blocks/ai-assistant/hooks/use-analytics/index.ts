import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useEffect } from '@wordpress/element';

// Get user data from the inial state
const tracksUserData = window?.Jetpack_Editor_Initial_State?.tracksUserData || null;
const blogId = parseInt( window?.Jetpack_Editor_Initial_State?.wpcomBlogId ) || 0;

const useAnalytics = () => {
	/**
	 * Initialize tracks with user data.
	 */
	useEffect( () => {
		if ( tracksUserData ) {
			jetpackAnalytics.initialize(
				tracksUserData?.userid,
				tracksUserData?.username,
				blogId ? { blog_id: blogId } : {}
			);
		}
	}, [] );

	return jetpackAnalytics;
};

export default useAnalytics;
