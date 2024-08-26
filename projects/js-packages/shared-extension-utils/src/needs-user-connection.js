import isCurrentUserConnected from './is-current-user-connected';
import { isSimpleSite } from './site-type-utils';

/**
 * Returns true if the current user is not connected to WP.com and the site is not a simple site.
 *
 * @return {boolean} Whether the current user is not connected to WP.com and the site is not a simple site.
 */
const needsUserConnection = () => {
	return ! isCurrentUserConnected() && ! isSimpleSite();
};

export default needsUserConnection;
