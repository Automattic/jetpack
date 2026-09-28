/**
 * External dependencies
 */
import { usePrefetchQuery, useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { viewerCountryQuery } from '../queries/viewer-country-query';

export function useViewerCountry() {
	return useQuery( viewerCountryQuery() );
}

/**
 * Starts the viewer-country lookup without subscribing to it. Call it where a
 * map will appear, before that screen's own data requests, so the country is
 * known by the time the map mounts.
 */
export function usePrefetchViewerCountry() {
	usePrefetchQuery( viewerCountryQuery() );
}
