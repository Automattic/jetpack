/**
 * External dependencies
 */
import { useHistory, useLocation } from 'react-router-dom';

/**
 * Uses the history and location to manipulate the URL pagination parameters.
 *
 * @returns {object} - Object containing useful handlers for URL pagination
 */
export const useQueryStringPages = () => {
	const history = useHistory();
	const location = useLocation();
	const setPageOnURL = page => {
		history.push( {
			pathname: location.pathname,
			search: `?page=${ page }`,
		} );
	};

	return {
		setPageOnURL,
	};
};
