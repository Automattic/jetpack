/**
 * External dependencies
 */
import { useLocation } from 'react-router-dom';

/**
 * Gets a given parameter from the search query.
 *
 * @param {string} parameterName - The name of the parameter to get from the query string.
 * @param {string} defaultValue - The default value to return if the given parameter is not set on the query string.
 * @returns {string} - The value of the parameter if it's set. The defaultValue if the parameter is not set.
 */
export const useSearchParam = ( parameterName: string, defaultValue: string = null ) => {
	const searchParams = new URLSearchParams( useLocation().search );
	return searchParams.has( parameterName ) ? searchParams.get( parameterName ) : defaultValue;
};
