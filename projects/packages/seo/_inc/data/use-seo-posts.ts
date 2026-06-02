import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import type { ContentPostType, ContentRow, SchemaType, SeoPostMeta } from './content-types';

// Only request the columns the Content tab renders, plus the SEO meta. Core
// REST returns `meta` as an object keyed by the registered meta names.
const POST_FIELDS = [ 'id', 'title', 'link', 'type', 'status', 'meta' ].join( ',' );

// The shape of a core REST post/page record, narrowed to what we read.
interface SeoPostRecord {
	id: number;
	title?: { rendered?: string };
	link?: string;
	type?: string;
	status?: string;
	meta?: Partial< SeoPostMeta >;
}

export interface UseSeoPostsArgs {
	postType: ContentPostType;
	page: number;
	perPage: number;
	search?: string;
	orderby?: string;
	order?: 'asc' | 'desc';
}

export interface UseSeoPostsReturn {
	items: ContentRow[];
	totalItems: number;
	totalPages: number;
	isLoading: boolean;
}

/**
 * Coerce a stored schema-type meta value to the allowed union. Anything
 * unexpected falls back to '' (no override), matching the server-side
 * sanitize in `Jetpack_SEO_Posts::sanitize_schema_type`.
 *
 * @param value - The raw `jetpack_seo_schema_type` meta value.
 * @return A valid {@link SchemaType}.
 */
function toSchemaType( value: unknown ): SchemaType {
	return value === 'article' || value === 'faq' ? value : '';
}

/**
 * Map a raw core REST post/page record to a Content table row, deriving the
 * factual SEO-field flags from its `meta`. Presence/state only — never a score.
 *
 * @param record - A core REST post/page record.
 * @return The corresponding {@link ContentRow}.
 */
function toContentRow( record: SeoPostRecord ): ContentRow {
	const meta = record.meta ?? {};
	const customTitle = meta.jetpack_seo_html_title ?? '';
	const description = meta.advanced_seo_description ?? '';

	return {
		id: record.id,
		title: decodeEntities( record.title?.rendered ?? '' ),
		link: record.link ?? '',
		// Core REST doesn't expose the wp-admin edit URL on the post resource,
		// so derive it from the post ID (the canonical Gutenberg editor path).
		editLink: `post.php?post=${ record.id }&action=edit`,
		type: record.type ?? '',
		status: record.status ?? '',
		customTitle,
		description,
		schemaType: toSchemaType( meta.jetpack_seo_schema_type ),
		noindex: !! meta.jetpack_seo_noindex,
		hasCustomTitle: customTitle !== '',
		hasDescription: description !== '',
	};
}

/**
 * Fetch the Content tab's post/page list from WordPress core REST, with
 * server-side pagination, search, and title sorting driven by DataViews view
 * state. Wraps `useEntityRecords( 'postType', postType, query )`; the SEO meta
 * comes back inside each record's `meta` object via the registered
 * `show_in_rest` post meta (no custom endpoint).
 *
 * @param args - The selected post type plus DataViews paging/search/sort state.
 * @return The mapped rows plus core-data's pagination + loading state.
 */
export default function useSeoPosts( args: UseSeoPostsArgs ): UseSeoPostsReturn {
	const { postType, page, perPage, search, orderby, order } = args;

	const query = useMemo( () => {
		const queryArgs: Record< string, unknown > = {
			context: 'edit',
			_fields: POST_FIELDS,
			page,
			per_page: perPage,
			orderby: orderby || 'title',
			order: order || 'asc',
			// Authoring/audit view: include drafts and other non-published
			// statuses the current user can see, not just published content.
			status: [ 'publish', 'future', 'draft', 'pending', 'private' ],
		};
		if ( search ) {
			queryArgs.search = search;
		}
		return queryArgs;
	}, [ page, perPage, search, orderby, order ] );

	const {
		records: rawRecords,
		hasResolved,
		totalItems,
		totalPages,
	} = useEntityRecords< SeoPostRecord >( 'postType', postType, query );

	const items = useMemo( () => ( rawRecords || [] ).map( toContentRow ), [ rawRecords ] );

	return {
		items,
		totalItems: totalItems ?? 0,
		totalPages: totalPages ?? 0,
		isLoading: ! hasResolved,
	};
}
