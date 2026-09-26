/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { viewerCountryQuery } from '../queries/viewer-country-query';

export function useViewerCountry() {
	return useQuery( viewerCountryQuery() );
}
