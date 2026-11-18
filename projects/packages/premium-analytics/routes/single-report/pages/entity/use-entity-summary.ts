/**
 * External dependencies
 */
import {
	decodeHtmlText,
	getApiErrorStatus,
	useMediaThumbnail,
} from '@jetpack-premium-analytics/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { SingleReportPageRecord } from '../../registry';
import type { EntitySummary } from '../adapter';

export type EntityRecordSummary = EntitySummary & {
	/** The record's `date`, a site-local datetime. */
	publishedDate?: string;
	/** The featured image's thumbnail URL. */
	imageUrl?: string;
	/** The record's public `link`. */
	url?: string;
};

type EntityRecordSelectors = {
	getEntityRecord: (
		kind: string,
		name: string,
		key: number | string,
		query: Record< string, unknown >
	) => unknown;
	hasFinishedResolution: ( selectorName: string, args: unknown[] ) => boolean;
	getResolutionError: ( selectorName: string, args: unknown[] ) => unknown;
};

type EntityRecordActions = {
	invalidateResolution: ( selectorName: string, args: unknown[] ) => void;
};

// Not the entity's default `edit` context, which answers 403 to a reader who cannot edit the record.
const VIEW_QUERY = { context: 'view' };

/**
 * A property of the record when it is a string with something in it.
 *
 * @param value - The property, of a shape nothing guarantees.
 * @return The string, or undefined.
 */
function readString( value: unknown ): string | undefined {
	return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * The summary of the entity a page is bound to, read from the record core-data answers by the
 * record convention: `title.rendered` or `name`, `featured_media`, `date` and `link`, each optional.
 *
 * @param entityId - The entity id, as the URL carries it.
 * @param page     - The page record, for the entity it names.
 * @return The entity summary.
 */
export function useEntitySummary(
	entityId: string,
	page: Pick< SingleReportPageRecord, 'entity' >
): EntityRecordSummary {
	const kind = page.entity?.kind;
	const name = page.entity?.name;
	// A number, as the other readers of the record key it, so its request is shared with theirs.
	const key = /^\d+$/.test( entityId ) ? Number( entityId ) : entityId;

	const { record, hasResolved, error } = useSelect(
		select => {
			if ( ! kind || ! name ) {
				return { record: undefined, hasResolved: true, error: null };
			}

			const core = select( coreStore ) as unknown as EntityRecordSelectors;
			const args = [ kind, name, key, VIEW_QUERY ];

			return {
				record: core.getEntityRecord( kind, name, key, VIEW_QUERY ),
				hasResolved: core.hasFinishedResolution( 'getEntityRecord', args ),
				error: core.getResolutionError( 'getEntityRecord', args ),
			};
		},
		[ kind, name, key ]
	);

	const { invalidateResolution } = useDispatch( coreStore ) as unknown as EntityRecordActions;
	const refetch = useCallback( () => {
		if ( kind && name ) {
			invalidateResolution( 'getEntityRecord', [ kind, name, key, VIEW_QUERY ] );
		}
	}, [ invalidateResolution, kind, name, key ] );

	const properties = ( record ?? {} ) as Record< string, unknown >;
	const title = properties.title as { rendered?: unknown } | null | undefined;
	const featuredMedia = properties.featured_media;
	const imageUrl = useMediaThumbnail(
		typeof featuredMedia === 'number' ? featuredMedia : undefined
	);
	const publishedDate = readString( properties.date );

	const hasRecord = record !== undefined && record !== null;
	const isMissing = hasResolved && ! hasRecord;
	const status = getApiErrorStatus( error );
	// No error at all means core-data knows no such entity, as for a post type outside REST.
	// A record the reader may not read (403) is presented like one that is not there.
	const isNotFound = isMissing && ( ! error || status === 404 || status === 403 );
	const isError = isMissing && ! isNotFound;

	return {
		title: decodeHtmlText( readString( title?.rendered ) ?? readString( properties.name ) ),
		publishedDate,
		allTimeStart: publishedDate,
		imageUrl,
		url: readString( properties.link ),
		isLoading: ! hasRecord && ! hasResolved,
		isError,
		error: isError ? error : null,
		isNotFound,
		refetch,
	};
}
