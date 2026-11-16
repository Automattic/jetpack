/**
 * External dependencies
 */
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { SingleReportPageRecord } from '../../registry';
import type { EntitySummary } from '../adapter';

type EntityBinding = NonNullable< SingleReportPageRecord[ 'entity' ] >;
type HeaderBinding = NonNullable< SingleReportPageRecord[ 'header' ] >;

type MediaRecord = {
	source_url?: string;
	media_details?: { sizes?: { thumbnail?: { source_url?: string } } };
};

export type EntityFieldSummary = EntitySummary & {
	/** Featured image URL, when `header.media` names an attachment id. */
	imageUrl?: string;
	/** Plain text of `header.description`, when that field is set. */
	description?: string;
};

/**
 * A core field is a string, or `{ rendered }` on a post title and excerpt.
 *
 * @param value - The field value.
 * @return The raw text, still possibly marked up.
 */
function renderedValue( value: unknown ): unknown {
	if ( typeof value === 'string' ) {
		return value;
	}
	if ( value && typeof value === 'object' && 'rendered' in value ) {
		return ( value as { rendered?: unknown } ).rendered;
	}
	return undefined;
}

/**
 * The field as text, with markup removed.
 *
 * @param value - The field value.
 * @return The text.
 */
function plainText( value: unknown ): string | undefined {
	const html = renderedValue( value );
	if ( typeof html !== 'string' ) {
		return undefined;
	}
	const text = html
		.replace( /<[^>]*>/g, '' )
		.replace( /\s+/g, ' ' )
		.trim();
	return text || undefined;
}

/**
 * The URL id as core-data keys a post: a positive integer, otherwise the raw segment.
 *
 * @param id - The `$id` segment.
 * @return The record id.
 */
function recordIdOf( id: string ): string | number {
	return /^[1-9]\d*$/.test( id ) ? Number( id ) : id;
}

/**
 * Load the record the page's `entity` names, and read the fields its `header` names.
 *
 * `header.media` is an attachment id on a post type, so the image is that attachment.
 *
 * @param entity   - The page's core-data entity.
 * @param header   - Field ids on that entity, or null when the page names none.
 * @param entityId - The entity id, as the URL carries it.
 * @return The summary the stage titles the page with.
 */
export function useEntitySummary(
	entity: EntityBinding,
	header: HeaderBinding | null,
	entityId: string
): EntityFieldSummary {
	const recordId = recordIdOf( entityId );
	const { record, hasResolved, isResolving, status } = useEntityRecord< Record< string, unknown > >(
		entity.kind,
		entity.name,
		recordId
	);
	const error = useSelect(
		select => {
			const core = select( coreStore ) as {
				getResolutionError?: (
					selectorName: string,
					args: unknown[]
				) => { code?: string } | undefined;
			};
			return core.getResolutionError?.( 'getEntityRecord', [ entity.kind, entity.name, recordId ] );
		},
		[ entity.kind, entity.name, recordId ]
	);
	const mediaField = header?.media ? record?.[ header.media ] : undefined;
	const mediaId = typeof mediaField === 'number' && mediaField > 0 ? mediaField : undefined;
	const media = useEntityRecord< MediaRecord >( 'postType', 'attachment', mediaId ?? 0, {
		enabled: mediaId !== undefined,
	} );
	const { invalidateResolution } = useDispatch( coreStore );
	const refetch = useCallback( () => {
		invalidateResolution( 'getEntityRecord', [ entity.kind, entity.name, recordId ] );
		if ( mediaId !== undefined ) {
			invalidateResolution( 'getEntityRecord', [ 'postType', 'attachment', mediaId ] );
		}
	}, [ entity.kind, entity.name, invalidateResolution, mediaId, recordId ] );

	const isLoading = isResolving || ! hasResolved;
	const isNotFound = ! isLoading && error?.code === 'rest_post_invalid_id';
	const isError = ! isLoading && status === 'ERROR' && ! isNotFound;

	return {
		title: plainText( header?.title ? record?.[ header.title ] : undefined ),
		description: plainText( header?.description ? record?.[ header.description ] : undefined ),
		imageUrl: media.record?.media_details?.sizes?.thumbnail?.source_url ?? media.record?.source_url,
		isLoading,
		isError,
		error: isError ? ( error ?? null ) : null,
		isNotFound,
		refetch,
	};
}
