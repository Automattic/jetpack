/**
 * External dependencies
 */
import { useLocation } from 'react-router-dom';

export const useSearchParams = () => {
	const location = useLocation();

	/**
	 * Gets a given parameter from the search query.
	 *
	 * @param {string} parameterName - The name of the parameter to get from the query string.
	 * @param {string} defaultValue - The default value to return if the given parameter is not set on the query string.
	 * @returns {string} - The value of the parameter if it's set. The defaultValue if the parameter is not set.
	 */
	const getParam = ( parameterName: string, defaultValue: string = null ) => {
		const searchParams = new URLSearchParams( location.search );
		return searchParams.has( parameterName ) ? searchParams.get( parameterName ) : defaultValue;
	};

	return {
		getParam,
	};
};
