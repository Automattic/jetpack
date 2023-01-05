/**
 * External dependencies
 */
import { useHistory } from 'react-router-dom';

/**
 * Uses the history to manipulate the URL pagination parameters.
 *
 * @returns {object} - Object containing useful handlers for URL pagination
 */
const useQueryStringPages = () => {
	const history = useHistory();
	const setPageOnURL = page => {
		const searchFragment = page > 1 ? `?page=${ page }` : '';
		if ( searchFragment !== history.location.search ) {
			history.push( {
				pathname: history.location.pathname,
				search: searchFragment,
			} );
		}
	};
	const forceFirstPage = () => {
		const searchFragment = '';
		if ( searchFragment !== history.location.search ) {
			history.replace( {
				pathname: history.location.pathname,
				search: searchFragment,
			} );
		}
	};

	return {
		setPageOnURL,
		forceFirstPage,
	};
};

export default useQueryStringPages;
