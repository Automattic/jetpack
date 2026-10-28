/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { siteIsCommercialQuery } from '../queries/site-is-commercial-query';

export function useSiteIsCommercial( options?: { enabled?: boolean } ) {
	return useQuery( { ...siteIsCommercialQuery(), enabled: options?.enabled ?? true } );
}
