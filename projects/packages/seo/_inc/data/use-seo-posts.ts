import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import type { ContentRow, ContentPostType, SchemaType, SeoPostMeta } from './content-types';

// Only request the columns the Content tab renders, plus the SEO meta. Core
// REST returns `meta` as an object keyed by the registered meta names.
const POST_FIELDS = [ 'id', 'title', 'link', 'type', 'status', 'meta' ].join( ',' );

// Only published content is indexed by search engines, so only published posts
// are relevant to SEO. Drafts and scheduled posts are excluded.
const STATUSES = [ 'publish' ];

// Core REST caps `per_page` at 100, so anything past the first 100 records of a
// type needs another request. We page through the whole collection using the
// total page count core-data derives from the `X-WP-TotalPages` response header.
//
// Once the total is known every remaining page is requested at once. A host
// serves only as many as it has PHP workers (~4 concurrent, ~1s each on a stock
// Atomic sandbox), so a 2.5k-post site loads in ~6s and the cost grows linearly:
// tens of thousands of posts mean hundreds of concurrent `WP_Query`-with-meta
// requests and a minute-plus of spinner.
//
// Throttling the fan-out to a sliding window of 5 pages per type was tried and
// measured: it cut achieved concurrency from ~4 to ~2.4 (each slide waits on a
// store update and a React commit), so the same 2.5k-post site took ~10s and the
// pathological site would take *longer*, not shorter. The window only lowers
// peak socket count. The fix that actually scales is server-side pagination —
// fetching the page of rows being displayed — which also removes the need to
// hold every record in memory.
const PER_PAGE = 100;

// The post types the Content tab covers.
const POST_TYPES: ContentPostType[] = [ 'post', 'page' ];

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

// The base query shared by both post types, so DataViews can filter, sort and
// paginate the merged set entirely client-side.
const BASE_QUERY = {
	context: 'edit',
	_fields: POST_FIELDS,
	per_page: PER_PAGE,
	status: STATUSES,
};

// `getEntityRecords` memoizes on argument *identity*. Hand out a single query
// object per (type, page) so repeated selector runs hit that memo instead of
// rebuilding the record list on every render.
const queries = new Map< string, object >();

/**
 * The core-data query for one page of one post type, stable across calls.
 *
 * @param postType - The post type to query ('post' | 'page').
 * @param page     - The 1-based page number.
 * @return The query object for that page.
 */
function pageQuery( postType: ContentPostType, page: number ): object {
	const key = `${ postType }:${ page }`;
	let query = queries.get( key );
	if ( ! query ) {
		query = { ...BASE_QUERY, page };
		queries.set( key, query );
	}
	return query;
}

// The slice of core-data's selectors this hook reads. `@wordpress/core-data`
// doesn't ship a selector map for `select( coreStore )`, so narrow it here.
type CoreSelect = ( store: typeof coreStore ) => {
	getEntityRecords: ( kind: string, name: string, query: object ) => SeoPostRecord[] | null;
	getEntityRecordsTotalPages: ( kind: string, name: string, query: object ) => number | null;
	getEntityRecordEdits: (
		kind: string,
		name: string,
		recordId: number
	) => { meta?: Partial< SeoPostMeta > } | undefined;
	hasFinishedResolution: ( selector: string, args: unknown[] ) => boolean;
};

/**
 * Overlay a record's unsaved core-data edits onto the fetched copy.
 *
 * The SEO inspector persists a row's meta with `apiFetch` and stages it in the
 * store with `editEntityRecord`, so that saving one row doesn't invalidate — and
 * refetch — every page of the collection (see [seo-inspector]). `getEntityRecords`
 * returns the records as they were *fetched* and never applies edits, so without
 * this the saved row would keep rendering its old SEO badges until a reload.
 *
 * @param record - A fetched core REST post/page record.
 * @param edits  - The record's pending core-data edits, if any.
 * @return The record with its edited meta applied.
 */
function withEdits(
	record: SeoPostRecord,
	edits: { meta?: Partial< SeoPostMeta > } | undefined
): SeoPostRecord {
	if ( ! edits?.meta ) {
		return record;
	}
	return { ...record, meta: { ...record.meta, ...edits.meta } };
}

interface PostTypeSelection {
	records: SeoPostRecord[];
	isLoading: boolean;
}

/**
 * Select every published record of one post type, requesting each page of the
 * core REST collection. The first page's response tells core-data how many pages
 * exist (from `X-WP-TotalPages`), which is what lets us request the rest;
 * selecting a page that hasn't been fetched starts its resolver, so this both
 * reads the records and drives the requests.
 *
 * @param select   - The `useSelect` registry selector.
 * @param postType - The post type to read ('post' | 'page').
 * @return The type's records plus its resolution state.
 */
function selectPostType( select: CoreSelect, postType: ContentPostType ): PostTypeSelection {
	const {
		getEntityRecords,
		getEntityRecordsTotalPages,
		getEntityRecordEdits,
		hasFinishedResolution,
	} = select( coreStore );

	// Null until page 1 resolves, so we ask for that page alone to begin with;
	// 0 when the type has no published content.
	const totalPages = getEntityRecordsTotalPages( 'postType', postType, pageQuery( postType, 1 ) );
	const wanted = Math.max( totalPages ?? 1, 1 );

	const records: SeoPostRecord[] = [];
	let isLoading = false;

	for ( let page = 1; page <= wanted; page++ ) {
		const query = pageQuery( postType, page );
		const pageRecords = getEntityRecords( 'postType', postType, query );
		if ( ! hasFinishedResolution( 'getEntityRecords', [ 'postType', postType, query ] ) ) {
			isLoading = true;
		}
		if ( pageRecords ) {
			for ( const record of pageRecords ) {
				records.push(
					withEdits( record, getEntityRecordEdits( 'postType', postType, record.id ) )
				);
			}
		}
	}

	return { records, isLoading };
}

/**
 * Fetch the Content tab's posts *and* pages from WordPress core REST and merge
 * them into a single list. Each type is paged through {@link PER_PAGE} records at
 * a time until its collection is exhausted, and mapped to a {@link ContentRow};
 * filtering, sorting and pagination happen client-side in the Content screen via
 * `filterSortAndPaginate`. The SEO meta comes back inside each record's `meta`
 * object via the registered `show_in_rest` post meta (no custom endpoint).
 *
 * @return The merged, mapped rows plus a combined loading state.
 */
export default function useSeoPosts(): UseSeoPostsReturn {
	const { records, isLoading } = useSelect( select => {
		const selections = POST_TYPES.map( postType => selectPostType( select, postType ) );

		return {
			records: selections.flatMap( selection => selection.records ),
			// Show the loading state until *every* page of both types has
			// resolved, so the table doesn't flash a partial list.
			isLoading: selections.some( selection => selection.isLoading ),
		};
	}, [] );

	const items = useMemo( () => records.map( toContentRow ), [ records ] );

	return { items, isLoading };
}
