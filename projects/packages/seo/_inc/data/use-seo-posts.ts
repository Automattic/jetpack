import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import type { ContentRow, SchemaType, SeoPostMeta } from './content-types';

// Only request the columns the Content tab renders, plus the SEO meta. Core
// REST returns `meta` as an object keyed by the registered meta names.
const POST_FIELDS = [ 'id', 'title', 'link', 'type', 'status', 'meta' ].join( ',' );

// Only published content is indexed by search engines, so only published posts
// are relevant to SEO. Drafts and scheduled posts are excluded.
const STATUSES = [ 'publish' ];

// Core REST caps `per_page` at 100. We request the max for each type and merge
// posts + pages client-side. NOTE: a site with more than 100 posts (or 100
// pages) won't show the overflow on the Content tab yet — acceptable for now;
// a future iteration can page/virtualize the merged set.
const PER_PAGE = 100;

// The shape of a core REST post/page record, narrowed to what we read.
interface SeoPostRecord {
	id: number;
	title?: { rendered?: string };
	link?: string;
	type?: string;
	status?: string;
	meta?: Partial< SeoPostMeta >;
}

export interface UseSeoPostsReturn {
	items: ContentRow[];
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

// A single fixed query shared by both post types, so DataViews can filter,
// sort and paginate the merged set entirely client-side.
const QUERY = {
	context: 'edit',
	_fields: POST_FIELDS,
	per_page: PER_PAGE,
	status: STATUSES,
};

/**
 * Fetch the Content tab's posts *and* pages from WordPress core REST and merge
 * them into a single list. Each type is fetched once (up to {@link PER_PAGE}
 * records) and mapped to a {@link ContentRow}; filtering, sorting and
 * pagination happen client-side in the Content screen via
 * `filterSortAndPaginate`. The SEO meta comes back inside each record's `meta`
 * object via the registered `show_in_rest` post meta (no custom endpoint).
 *
 * @return The merged, mapped rows plus a combined loading state.
 */
export default function useSeoPosts(): UseSeoPostsReturn {
	const { records: postRecords, hasResolved: postsResolved } = useEntityRecords< SeoPostRecord >(
		'postType',
		'post',
		QUERY
	);
	const { records: pageRecords, hasResolved: pagesResolved } = useEntityRecords< SeoPostRecord >(
		'postType',
		'page',
		QUERY
	);

	const items = useMemo(
		() => [ ...( postRecords || [] ), ...( pageRecords || [] ) ].map( toContentRow ),
		[ postRecords, pageRecords ]
	);

	return {
		items,
		// Show the loading state until *both* queries have resolved, so the
		// table doesn't flash a posts-only list before pages arrive.
		isLoading: ! postsResolved || ! pagesResolved,
	};
}
