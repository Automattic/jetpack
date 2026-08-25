/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Types
 */
import type { APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Query argument that asks the REST API for the collection field shape.
 *
 * The controller falls back to the legacy `label-value` shape whenever
 * `fields_format` is absent. A write that omits it answers with legacy-shaped
 * fields, and `@wordpress/core-data` caches that over the good record: the open
 * response inspector then re-renders without field icons, value badges or
 * type-specific formatting until the page is reloaded.
 */
const FIELDS_FORMAT_QUERY = { fields_format: 'collection' };

const ENTITY = [ 'postType', 'feedback' ] as const;

/**
 * `apiFetch` that asks for the collection field format.
 *
 * `saveEntityRecord()` builds its own request path and takes no query
 * arguments, so this rides in through its `__unstableFetch` option. (core-data's
 * `baseURLParams` is not an alternative: resolvers apply it, its write actions
 * do not.)
 *
 * @param options - The apiFetch options supplied by core-data.
 * @return          The apiFetch promise.
 */
const fetchWithFieldsFormat = ( options: APIFetchOptions ) =>
	apiFetch( { ...options, path: addQueryArgs( options.path, FIELDS_FORMAT_QUERY ) } );

type SaveEntityRecord = (
	kind: string,
	name: string,
	record: Record< string, unknown >,
	options?: Record< string, unknown >
) => Promise< unknown >;

type DeleteEntityRecord = (
	kind: string,
	name: string,
	recordId: number,
	query?: Record< string, unknown >,
	options?: Record< string, unknown >
) => Promise< unknown >;

/**
 * Save a form response, keeping its fields in the shape the dashboard renders.
 *
 * Always use this rather than dispatching `saveEntityRecord` for a feedback
 * record directly — a save without the field format silently degrades the open
 * inspector.
 *
 * Caveat: core-data's `__experimentalBatch` substitutes its own fetch, so a
 * batched save would drop the format again.
 *
 * @param saveEntityRecord - core-data's `saveEntityRecord` dispatcher.
 * @param record           - The response record to save.
 * @param options          - Additional `saveEntityRecord` options.
 * @return                   The dispatch promise.
 */
export const saveResponse = (
	saveEntityRecord: SaveEntityRecord,
	record: Record< string, unknown >,
	options: Record< string, unknown > = {}
) =>
	saveEntityRecord( ...ENTITY, record, {
		...options,
		__unstableFetch: fetchWithFieldsFormat,
	} );

/**
 * Delete (or trash) a form response.
 *
 * The deleted record never reaches the core-data cache, but the response body
 * is still serialized, so the format is requested here too for consistency with
 * `saveResponse()`.
 *
 * @param deleteEntityRecord - core-data's `deleteEntityRecord` dispatcher.
 * @param recordId           - The response ID.
 * @param query              - Additional query arguments (e.g. `force`).
 * @param options            - Additional `deleteEntityRecord` options.
 * @return                     The dispatch promise.
 */
export const deleteResponse = (
	deleteEntityRecord: DeleteEntityRecord,
	recordId: number,
	query: Record< string, unknown > = {},
	options: Record< string, unknown > = {}
) => deleteEntityRecord( ...ENTITY, recordId, { ...query, ...FIELDS_FORMAT_QUERY }, options );
