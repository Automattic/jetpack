/**
 * External dependencies
 */
import { useLocation, useHistory } from 'react-router-dom';

export const useSearchParams = () => {
	const location = useLocation();
	const history = useHistory();
	const searchParams = new URLSearchParams( location.search );

	/**
	 * Gets a given parameter from the search query.
	 *
	 * @param {string} parameterName - The name of the parameter to get from the query string.
	 * @param {string} defaultValue - The default value to return if the given parameter is not set on the query string.
	 * @returns {string} - The value of the parameter if it's set. The defaultValue if the parameter is not set.
	 */
	const getParam = ( parameterName: string, defaultValue: string = null ) => {
		return searchParams.has( parameterName ) ? searchParams.get( parameterName ) : defaultValue;
	};

	/**
	 * Sets a given parameter on the search query data, but does not refresh the URL.
	 *
	 * @param {string} parameterName - The name of the parameter to set on the query string.
	 * @param {string} value - The value to be set for the parameter on the query string.
	 */
	const setParam = ( parameterName: string, value: string = null ) => {
		searchParams.set( parameterName, value );
	};

	/**
	 * Update the URL query string with the current values of the searchParams object.
	 */
	const update = () => {
		const searchFragment = '?' + searchParams.toString();
		if ( searchFragment !== history.location.search ) {
			history.push( {
				search: searchFragment,
			} );
		}
	};

	/**
	 * Force an empty query string.
	 */
	const reset = () => {
		const searchFragment = '';
		if ( searchFragment !== history.location.search ) {
			history.replace( {
				pathname: history.location.pathname,
				search: searchFragment,
			} );
		}
	};

	return {
		getParam,
		setParam,
		update,
		reset,
	};
};
