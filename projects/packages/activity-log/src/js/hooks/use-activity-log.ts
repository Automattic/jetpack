/**
 * TanStack Query factories for the Activity Log REST endpoints.
 *
 * These mirror Calypso's `siteActivityLogQuery` / `siteActivityLogGroupCountsQuery`
 * shapes — same query keys, same response transform (`current.orderedItems →
 * activityLogs`) — so the UI code ports with minimal changes. The transport
 * is `@wordpress/api-fetch` against `/jetpack/v4/activity-log/*` instead of
 * WPCOM directly.
 */
import { queryOptions } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import type {
	ActivityLogActorsParams,
	ActivityLogActorsResponse,
	ActivityLogEntry,
	ActivityLogGroupCountResponse,
	ActivityLogParams,
	ActivityLogsData,
} from '../components/ActivityLog/types';

interface RawActivityLogResponse {
	current?: { orderedItems?: ActivityLogEntry[] };
	totalItems?: number;
	pages?: number;
	itemsPerPage?: number;
	totalPages?: number;
}

/**
 * Assemble a REST path with a query string, handling array params by
 * appending them with the PHP-style `[]` suffix our REST controller
 * understands.
 *
 * Note that `apiFetch`/`@wordpress/url` re-serialize the path before
 * dispatching, so the live wire form is typically indexed
 * (`group[0]=plugin`) rather than the bare `group[]=plugin` this
 * function emits — either form round-trips through the controller's
 * `type: array` validation, so both are accepted.
 *
 * @param base   - Path prefix, e.g. `/jetpack/v4/activity-log`.
 * @param params - Key/value map of query params. Arrays produce repeated
 *               `key[]=value` pairs; undefined/null are dropped.
 * @return The combined path.
 */
const buildPath = ( base: string, params: ActivityLogParams | ActivityLogActorsParams ): string => {
	const search = new URLSearchParams();
	Object.entries( params ).forEach( ( [ key, value ] ) => {
		if ( value === undefined || value === null ) {
			return;
		}
		if ( Array.isArray( value ) ) {
			value.forEach( entry => search.append( `${ key }[]`, String( entry ) ) );
			return;
		}
		search.append( key, String( value ) );
	} );
	const query = search.toString();
	return query ? `${ base }?${ query }` : base;
};

/**
 * TanStack Query options for the paginated activity list. Unwraps the WPCOM
 * `current.orderedItems` shape into the flatter `activityLogs` shape the UI
 * components consume.
 *
 * @param params - Forwarded to the server as query params.
 * @return `queryOptions` ready to pass to `useQuery`.
 */
export function activityLogQuery( params: ActivityLogParams ) {
	return queryOptions( {
		queryKey: [ 'jetpack-activity-log', 'list', params ],
		queryFn: async (): Promise< ActivityLogsData > => {
			const response = await apiFetch< RawActivityLogResponse >( {
				path: buildPath( '/jetpack/v4/activity-log', params ),
			} );
			return {
				activityLogs: response.current?.orderedItems ?? [],
				totalItems: response.totalItems,
				pages: response.pages,
				itemsPerPage: response.itemsPerPage,
				totalPages: response.totalPages,
			};
		},
	} );
}

/**
 * TanStack Query options for the group-counts endpoint powering the
 * Activity Type filter dropdown.
 *
 * @param params - Forwarded to the server as query params.
 * @return `queryOptions` ready to pass to `useQuery`.
 */
export function activityLogGroupCountsQuery( params: ActivityLogParams ) {
	return queryOptions( {
		queryKey: [ 'jetpack-activity-log', 'group-counts', params ],
		queryFn: async (): Promise< ActivityLogGroupCountResponse > => {
			return apiFetch< ActivityLogGroupCountResponse >( {
				path: buildPath( '/jetpack/v4/activity-log/count/group', params ),
			} );
		},
	} );
}

/**
 * TanStack Query options for the actors endpoint powering the
 * "Performed by" filter dropdown.
 *
 * @param params - Forwarded to the server as query params.
 * @return `queryOptions` ready to pass to `useQuery`.
 */
export function activityLogActorsQuery( params: ActivityLogActorsParams ) {
	return queryOptions( {
		queryKey: [ 'jetpack-activity-log', 'actors', params ],
		queryFn: async (): Promise< ActivityLogActorsResponse > => {
			return apiFetch< ActivityLogActorsResponse >( {
				path: buildPath( '/jetpack/v4/activity-log/actors', params ),
			} );
		},
	} );
}
