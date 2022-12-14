import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useEffect } from '@wordpress/element';
import { getJetpackData } from './../get-jetpack-data';
import { isCurrentUserConnected } from './../is-current-user-connected';

const useAnalytics = () => {
	const { userid, username } = getJetpackData()?.tracksUserData ?? {};
	const blog_id = getJetpackData()?.wpcomBlogId ?? undefined;

	/**
	 * Initialize tracks with user and blog data.
	 * This will only work if the user is connected.
	 */
	useEffect( () => {
		if ( ! isCurrentUserConnected || ! userid || ! username || ! blog_id ) {
			return;
		}

		jetpackAnalytics.initialize( userid, username, {
			blog_id,
		} );
	}, [ blog_id, userid, username ] );

	return jetpackAnalytics;
};

export default useAnalytics;
