import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import type { ContentRow, PostTypeOption, SchemaType, SeoPostMeta } from './content-types';

// Only request the columns the Content tab renders, plus the SEO meta. Core
// REST returns `meta` as an object keyed by the registered meta names.
const POST_FIELDS = [ 'id', 'title', 'link', 'type', 'status', 'meta' ].join( ',' );

// Only published content is indexed by search engines, so only published posts
// are relevant to SEO. Drafts and scheduled posts are excluded.
const STATUSES = [ 'publish' ];

// Core REST caps `per_page` at 100. We request the max for each type and merge
// supported content types client-side. NOTE: a site with more than 100 items
// per type won't show the overflow on the Content tab yet — acceptable for now;
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

interface SeoPostTypeRecord {
	slug?: string;
	name?: string;
	rest_base?: string;
	rest_namespace?: string;
	viewable?: boolean;
	visibility?: {
		show_ui?: boolean;
	};
}

export interface UseSeoPostsReturn {
	items: ContentRow[];
	isLoading: boolean;
	postTypeOptions: PostTypeOption[];
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

const POST_TYPES_QUERY = {
	context: 'edit',
	per_page: -1,
};

function normalizePostTypes( records: unknown ): SeoPostTypeRecord[] {
	if ( Array.isArray( records ) ) {
		return records as SeoPostTypeRecord[];
	}
	if ( records && typeof records === 'object' ) {
		return Object.values( records ) as SeoPostTypeRecord[];
	}
	return [];
}

function isSupportedPostType( postType: SeoPostTypeRecord ): postType is SeoPostTypeRecord & {
	slug: string;
	name: string;
} {
	return (
		typeof postType.slug === 'string' &&
		postType.slug !== 'attachment' &&
		typeof postType.rest_base === 'string' &&
		postType.viewable === true &&
		postType.visibility?.show_ui === true
	);
}

function sortPostTypes(
	a: SeoPostTypeRecord & { slug: string; name: string },
	b: SeoPostTypeRecord & { slug: string; name: string }
): number {
	const preferred: Record< string, number > = { post: 0, page: 1 };
	const aRank = preferred[ a.slug ] ?? 99;
	const bRank = preferred[ b.slug ] ?? 99;
	if ( aRank !== bRank ) {
		return aRank - bRank;
	}
	return a.name.localeCompare( b.name );
}

/**
 * Fetch the Content tab's supported post types from WordPress core REST and
 * merge them into a single list. Each type is fetched once (up to
 * {@link PER_PAGE} records) and mapped to a {@link ContentRow}; filtering,
 * sorting and pagination happen client-side in the Content screen via
 * `filterSortAndPaginate`. The SEO meta comes back inside each record's `meta`
 * object via the registered `show_in_rest` post meta (no custom endpoint).
 *
 * @return The merged, mapped rows plus post type options and a combined loading state.
 */
export default function useSeoPosts(): UseSeoPostsReturn {
	return useSelect( select => {
		const core = select( coreStore );
		const rawPostTypes = normalizePostTypes(
			core.getEntityRecords( 'root', 'postType', POST_TYPES_QUERY )
		);
		const postTypes = rawPostTypes.filter( isSupportedPostType ).sort( sortPostTypes );
		const postTypesResolved = core.hasFinishedResolution( 'getEntityRecords', [
			'root',
			'postType',
			POST_TYPES_QUERY,
		] );

		let recordsResolved = postTypesResolved;
		const records: SeoPostRecord[] = [];

		for ( const postType of postTypes ) {
			const postTypeRecords = core.getEntityRecords( 'postType', postType.slug, QUERY ) as
				| SeoPostRecord[]
				| null;

			records.push( ...( postTypeRecords ?? [] ) );
			recordsResolved =
				recordsResolved &&
				core.hasFinishedResolution( 'getEntityRecords', [ 'postType', postType.slug, QUERY ] );
		}

		return {
			items: records.map( toContentRow ),
			postTypeOptions: postTypes.map( postType => ( {
				value: postType.slug,
				label: postType.name,
			} ) ),
			isLoading: ! postTypesResolved || ! recordsResolved,
		};
	}, [] );
}
