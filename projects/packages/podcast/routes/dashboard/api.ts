/**
 * On Simple, `podcasting_*` options live in the wpcom site-settings store —
 * `/wp/v2/settings` isn't authoritative there. On Atomic, `register_setting()`
 * schema injection makes `/wp/v2/settings` work. Each fetcher swizzles paths
 * accordingly so callers don't have to care.
 */

import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type {
	Episode,
	EpisodeStats,
	PodcastSettings,
	PodcastSettingsUpdate,
	PodcastShowUrls,
	PodcatcherId,
} from './types';

export interface CategoryTerm {
	id: number;
	name: string;
	slug: string;
}

export interface EpisodesQueryArgs {
	categoryId: number;
	page?: number;
	perPage?: number;
	orderBy?: 'date' | 'title';
	order?: 'asc' | 'desc';
	search?: string;
	status?: string;
}

export interface EpisodesPage {
	episodes: Episode[];
	totalPages: number;
	total: number;
}

const PODCAST_KEYS: Array< keyof PodcastSettings > = [
	'podcasting_category_id',
	'podcasting_title',
	'podcasting_talent_name',
	'podcasting_summary',
	'podcasting_copyright',
	'podcasting_explicit',
	'podcasting_image',
	'podcasting_image_id',
	'podcasting_category_1',
	'podcasting_category_2',
	'podcasting_category_3',
	'podcasting_email',
	'podcasting_show_urls',
];

// Keep in sync with `SHOW_URL_HOSTS` in src/class-settings.php.
const PODCATCHER_IDS: readonly PodcatcherId[] = [
	'pocketcasts',
	'apple',
	'spotify',
	'youtube',
	'amazon',
	'podcastindex',
] as const;

const normalizeShowUrls = ( raw: unknown ): PodcastShowUrls => {
	const source = ( raw && typeof raw === 'object' ? raw : {} ) as Record< string, unknown >;
	const out = {} as PodcastShowUrls;
	for ( const id of PODCATCHER_IDS ) {
		const value = source[ id ];
		out[ id ] = typeof value === 'string' ? value : '';
	}
	return out;
};

const getBlogId = (): number => Number( getSiteData()?.wpcom?.blog_id ?? 0 );

const pickPodcastFields = ( raw: Record< string, unknown > ): PodcastSettings => {
	const numericKey = ( key: keyof PodcastSettings ) =>
		key === 'podcasting_category_id' || key === 'podcasting_image_id';

	const toString = ( value: unknown ): string => {
		if ( typeof value === 'string' ) {
			return value;
		}
		if ( value == null ) {
			return '';
		}
		return String( value );
	};

	const out: Record< string, unknown > = {};
	for ( const key of PODCAST_KEYS ) {
		const value = raw[ key ];
		if ( numericKey( key ) ) {
			out[ key ] = typeof value === 'number' ? value : Number( value ?? 0 ) || 0;
		} else if ( key === 'podcasting_explicit' ) {
			out[ key ] = value === 'yes' || value === 'clean' ? value : 'no';
		} else if ( key === 'podcasting_show_urls' ) {
			out[ key ] = normalizeShowUrls( value );
		} else {
			out[ key ] = toString( value );
		}
	}
	return out as unknown as PodcastSettings;
};

/**
 * Fetch the `podcasting_*` options from the active host's settings endpoint.
 *
 * @return Resolved settings with all PodcastSettings keys present.
 */
export async function fetchSettings(): Promise< PodcastSettings > {
	const blogId = getBlogId();

	if ( isSimpleSite() && blogId ) {
		const result = ( await apiFetch( {
			path: `/rest/v1.4/sites/${ blogId }/settings`,
			method: 'GET',
		} ) ) as { settings?: Record< string, unknown > };
		return pickPodcastFields( ( result.settings || result ) as Record< string, unknown > );
	}

	const result = ( await apiFetch( {
		path: '/wp/v2/settings',
		method: 'GET',
	} ) ) as Record< string, unknown >;
	return pickPodcastFields( result );
}

/**
 * Persist a partial settings update; the server merges it into stored values.
 *
 * @param updates - Subset of PodcastSettings to write.
 * @return         Merged settings as the server now sees them.
 */
export async function updateSettings( updates: PodcastSettingsUpdate ): Promise< PodcastSettings > {
	const blogId = getBlogId();

	if ( isSimpleSite() && blogId ) {
		const result = ( await apiFetch( {
			path: `/rest/v1.4/sites/${ blogId }/settings`,
			method: 'POST',
			data: updates,
		} ) ) as { updated?: Record< string, unknown > };
		return pickPodcastFields( ( result.updated || result ) as Record< string, unknown > );
	}

	const result = ( await apiFetch( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: updates,
	} ) ) as Record< string, unknown >;
	return pickPodcastFields( result );
}

/**
 * Fetch every category term, paging through 100 at a time.
 *
 * @return All category terms on the site.
 */
export async function fetchCategories(): Promise< CategoryTerm[] > {
	const blogId = getBlogId();

	if ( isSimpleSite() && blogId ) {
		const out: CategoryTerm[] = [];
		let page = 1;

		while ( true ) {
			const result = ( await apiFetch( {
				path: `/rest/v1.1/sites/${ blogId }/taxonomies/category/terms?page=${ page }&number=100`,
				method: 'GET',
			} ) ) as {
				terms?: Array< { ID: number; name: string; slug: string } >;
				found?: number;
			};
			const terms = result.terms || [];
			out.push( ...terms.map( t => ( { id: t.ID, name: t.name, slug: t.slug } ) ) );
			if ( out.length >= ( result.found || 0 ) || terms.length === 0 ) {
				break;
			}
			page++;
		}
		return out;
	}

	const out: CategoryTerm[] = [];
	let page = 1;

	while ( true ) {
		const response = ( await apiFetch( {
			path: addQueryArgs( '/wp/v2/categories', { per_page: 100, page } ),
			method: 'GET',
			parse: false,
		} ) ) as Response;
		const data = ( await response.json() ) as Array< { id: number; name: string; slug: string } >;
		out.push( ...data.map( t => ( { id: t.id, name: t.name, slug: t.slug } ) ) );
		const totalPages = parseInt( response.headers.get( 'X-WP-TotalPages' ) || '1', 10 );
		if ( page >= totalPages || data.length === 0 ) {
			break;
		}
		page++;
	}
	return out;
}

/**
 * Create a new category term.
 *
 * @param name - Display name for the new category.
 * @return      The created term.
 */
export async function createCategory( name: string ): Promise< CategoryTerm > {
	const blogId = getBlogId();

	if ( isSimpleSite() && blogId ) {
		const result = ( await apiFetch( {
			path: `/rest/v1.1/sites/${ blogId }/taxonomies/category/new`,
			method: 'POST',
			data: { name },
		} ) ) as { ID: number; name: string; slug: string };
		return { id: result.ID, name: result.name, slug: result.slug };
	}

	const result = ( await apiFetch( {
		path: '/wp/v2/categories',
		method: 'POST',
		data: { name },
	} ) ) as { id: number; name: string; slug: string };
	return { id: result.id, name: result.name, slug: result.slug };
}

/**
 * Fetch a page of posts in the podcast category.
 *
 * @param args - Pagination, sort, search, and status filter args.
 * @return      The page of episodes plus pagination metadata.
 */
export async function fetchEpisodes( args: EpisodesQueryArgs ): Promise< EpisodesPage > {
	const {
		categoryId,
		page = 1,
		perPage = 20,
		orderBy = 'date',
		order = 'desc',
		search = '',
		status = 'any',
	} = args;

	const query: Record< string, string | number > = {
		categories: categoryId,
		page,
		per_page: perPage,
		orderby: orderBy,
		order,
		_embed: 'wp:featuredmedia',
	};
	if ( search ) {
		query.search = search;
	}
	if ( status ) {
		query.status = status;
	}

	const response = ( await apiFetch( {
		path: addQueryArgs( '/wp/v2/posts', query ),
		method: 'GET',
		parse: false,
	} ) ) as Response;

	const episodes = ( await response.json() ) as Episode[];
	const total = parseInt( response.headers.get( 'X-WP-Total' ) || '0', 10 );
	const totalPages = parseInt( response.headers.get( 'X-WP-TotalPages' ) || '1', 10 );

	return { episodes, total, totalPages };
}

/**
 * Fetch per-episode plays + duration. Chunked to 50 IDs per request to match
 * the wpcom endpoint's max page size.
 *
 * @param postIds - Episode post IDs to look up stats for.
 * @return         Stats for each post that had data; missing posts are omitted.
 */
export async function fetchEpisodeStats( postIds: number[] ): Promise< EpisodeStats[] > {
	if ( postIds.length === 0 ) {
		return [];
	}

	const blogId = getBlogId();
	if ( ! blogId ) {
		return [];
	}

	const out: EpisodeStats[] = [];
	for ( let i = 0; i < postIds.length; i += 50 ) {
		const chunk = postIds.slice( i, i + 50 );
		const result = ( await apiFetch( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/podcast-stats/episode-totals`, {
				post_ids: chunk.join( ',' ),
			} ),
			method: 'GET',
		} ) ) as { episodes?: EpisodeStats[] } | EpisodeStats[];

		if ( Array.isArray( result ) ) {
			out.push( ...result );
		} else if ( result.episodes ) {
			out.push( ...result.episodes );
		}
	}
	return out;
}
