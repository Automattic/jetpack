import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';
import { flattenVideoTracks } from '../../client/lib/video-tracks';
import { buildShortcode } from '../utils/format';
import { isSimpleSite } from '../utils/is-simple';
import type { VideoTracksResponseBodyProps } from '../../client/types';
import type { LibraryItem, LibraryItemPrivacy } from '../types/library';
import type { View } from '@wordpress/dataviews';

const REST_PATH = '/wp/v2/media';

type ApiMediaItem = {
	id: number;
	title?: { rendered?: string };
	slug?: string;
	source_url?: string;
	date?: string;
	mime_type?: string;
	media_details?: {
		length?: number;
		filesize?: number;
		width?: number;
		height?: number;
		videopress?: { duration?: number; poster?: string; finished?: boolean };
		// WordPress.com Simple exposes the ready poster + duration directly on
		// `media_details` (there's no `videopress` sub-object there).
		thumb?: string;
		duration_milliseconds?: number;
	};
	jetpack_videopress?: {
		guid?: string;
		rating?: string;
		display_embed?: 0 | 1 | boolean;
		allow_download?: 0 | 1 | boolean;
		privacy_setting?: 0 | 1 | 2;
		is_private?: boolean;
		description?: string;
		caption?: string;
		tracks?: VideoTracksResponseBodyProps;
	};
};

type PaginationInfo = { totalItems: number; totalPages: number };

const SUPPORTED_ORDERBY = new Set( [ 'title', 'date', 'slug' ] );

// DataViews field id → /wp/v2/media `orderby` value. Fields not in
// this map are forwarded as-is and filtered by SUPPORTED_ORDERBY.
// Attachment slugs are auto-generated from the upload filename, so
// orderby=slug approximates a filename sort.
const SORT_FIELD_MAP: Record< string, string > = {
	uploadDate: 'date',
	filename: 'slug',
};

const PRIVACY_TO_INT: Record< LibraryItemPrivacy, 0 | 1 | 2 > = {
	public: 0,
	private: 1,
	'site-default': 2,
};

const PRIVACY_FROM_INT: Record< 0 | 1 | 2, LibraryItemPrivacy > = {
	0: 'public',
	1: 'private',
	2: 'site-default',
};

/**
 * Map a UI privacy string to its WPCOM integer code.
 *
 * @param value - The UI privacy string ('public' | 'private' | 'site-default').
 * @return The corresponding WPCOM integer (0 | 1 | 2).
 */
export function privacyStringToInt( value: LibraryItemPrivacy ): 0 | 1 | 2 {
	return PRIVACY_TO_INT[ value ];
}

/**
 * Map a WPCOM privacy integer to its UI string representation.
 *
 * @param value - The WPCOM integer code (0 | 1 | 2 | undefined).
 * @return The corresponding UI privacy string.
 */
export function privacyIntToString( value: 0 | 1 | 2 | undefined ): LibraryItemPrivacy {
	if ( value === undefined ) {
		return 'site-default';
	}
	return PRIVACY_FROM_INT[ value ] ?? 'site-default';
}

/**
 * Convert a DataViews View into REST API query arguments for /wp/v2/media.
 *
 * @param view - The current DataViews view state (sort, filters, pagination, search).
 * @return A plain object of query args suitable for addQueryArgs.
 */
export function viewToQueryArgs( view: View ): Record< string, string | number > {
	// WordPress.com Simple rejects the `media_type` param (HTTP 400) and never tags
	// VideoPress items with the `video/videopress` mime — VideoPress data lives in
	// wpcom's videos table, not postmeta. Privacy and type filters are still honored
	// server-side there: the package's `rest_attachment_query` PHP filter resolves
	// them into post__in / post__not_in ID sets from the videos table, so totals stay
	// exact and there's no client-side over-fetch.
	const simple = isSimpleSite();
	const args: Record< string, string | number > = {
		mime_type: 'video/*',
		page: view.page ?? 1,
		per_page: view.perPage ?? 12,
		// Always hide local attachments that already have a VideoPress
		// sibling (they carry the `_videopress_uploaded_id` post-meta).
		// The sibling is the row we want to surface; the original local
		// is a leftover that would let users try to re-upload it.
		videopress_hide_already_uploaded: 1,
	};
	if ( ! simple ) {
		args.media_type = 'video';
	} else {
		// `mime_type=video/*` doesn't narrow the query on Simple; this custom
		// param is handled by the package's PHP `rest_attachment_query` filter
		// (post_mime_type LIKE 'video/%'), keeping the X-WP-Total headers exact.
		args.videopress_only_videos = 1;
	}

	const rawSortField = view.sort?.field;
	const sortField = rawSortField ? SORT_FIELD_MAP[ rawSortField ] ?? rawSortField : undefined;
	if ( sortField && SUPPORTED_ORDERBY.has( sortField ) ) {
		args.orderby = sortField;
		args.order = view.sort?.direction ?? 'desc';
	}

	const search = view.search?.trim();
	if ( search ) {
		args.search = search;
	}

	for ( const filter of view.filters ?? [] ) {
		if ( filter.value === undefined || filter.value === null || filter.value === 'all' ) {
			continue;
		}
		if ( filter.field === 'privacy' ) {
			// Honored on both hosts. Off-Simple the package's PHP
			// rest_attachment_query filter turns this into a postmeta meta_query;
			// on Simple it resolves the effective-visibility ID set from wpcom's
			// videos table (post__in). Same param either way.
			args.videopress_privacy_setting = String(
				privacyStringToInt( filter.value as LibraryItemPrivacy )
			);
		} else if ( filter.field === 'type' ) {
			if ( filter.value === 'videopress' ) {
				if ( simple ) {
					// Constrain to wpcom videos-table members. The package's PHP
					// rest_attachment_query filter resolves this into a post__in
					// ID set, on top of the always-sent `videopress_only_videos`
					// mime constraint, so X-WP-Total stays exact.
					args.videopress_has_guid = 1;
				} else {
					// Off-Simple: narrow the mime filter to video/videopress and
					// drop media_type — empirically, setting both broadens the
					// query and returns non-videopress items too.
					delete args.media_type;
					args.mime_type = 'video/videopress';
				}
			} else if ( filter.value === 'local' ) {
				// Both hosts: exclude VideoPress items via the package's PHP
				// rest_attachment_query filter. Off-Simple that's a postmeta
				// NOT EXISTS on videopress_guid; on Simple it's a post__not_in of
				// the videos-table members.
				args.no_videopress = 1;
			}
		} else if ( filter.field === 'uploadDate' ) {
			// DataViews emits the value from <input type=datetime-local>
			// as a local-time string; convert to UTC ISO8601 for the WP
			// REST API. Only `before` and `after` are supported here
			// (matching the field's filterBy.operators allowlist).
			const parsed = new Date( filter.value as string );
			if ( ! Number.isNaN( parsed.getTime() ) ) {
				const iso = parsed.toISOString();
				if ( filter.operator === 'before' ) {
					args.before = iso;
				} else if ( filter.operator === 'after' ) {
					args.after = iso;
				}
			}
		}
	}

	return args;
}

/**
 * Transform a raw /wp/v2/media API item into a LibraryItem.
 *
 * @param raw    - The raw media item from the REST API response.
 * @param simple - Whether the dashboard is running on WordPress.com Simple (drives the media-shape branch).
 * @return A normalized LibraryItem for the VideoPress library UI.
 */
function toLibraryItem( raw: ApiMediaItem, simple: boolean ): LibraryItem {
	const vp = raw.jetpack_videopress;
	const isVideoPress = Boolean( vp?.guid );
	const details = raw.media_details;
	// Self-hosted nests poster/duration/finished under `media_details.videopress`;
	// WordPress.com Simple omits that sub-object and returns a ready-to-play `thumb` +
	// `duration_milliseconds` on `media_details` itself.
	const vpDetails = details?.videopress;
	const durationMs = simple ? details?.duration_milliseconds : vpDetails?.duration;
	const durationSeconds =
		durationMs !== undefined ? Math.floor( durationMs / 1000 ) : details?.length ?? 0;
	// On Simple `media_details.thumb` is a bare filename, not a URL — the ready
	// poster lives on the VideoPress CDN keyed by the video guid (same URL shape
	// the editor uses for chapter/thumbnail files).
	const poster =
		simple && vp?.guid && details?.thumb
			? `https://videos.files.wordpress.com/${ vp.guid }/${ details.thumb }`
			: vpDetails?.poster;
	const finished = vpDetails?.finished;
	// A VideoPress item with no poster isn't displayable yet: still transcoding, or —
	// on Simple — an unprocessed/orphaned record whose media_details is empty (no
	// thumb/duration, video won't load). Self-hosted additionally has finished===false;
	// on Simple that flag is absent (no media_details.videopress), so the poster check
	// carries it. Rendered as a processing placeholder instead of a blank/black tile.
	const isProcessing = isVideoPress && ( ! poster || finished === false );
	return {
		id: String( raw.id ),
		guid: vp?.guid ?? '',
		type: isVideoPress ? 'videopress' : 'local',
		title: decodeEntities( raw.title?.rendered ?? raw.slug ?? '' ),
		filename: raw.source_url?.split( '/' ).pop() ?? '',
		thumbnailUrl: poster ?? null,
		durationSeconds,
		uploadDate: raw.date ?? '',
		privacy: privacyIntToString( vp?.privacy_setting ),
		isPrivate: Boolean( vp?.is_private ),
		fileSizeBytes: raw.media_details?.filesize ?? 0,
		upload: { status: 'idle', progress: 0 },
		description: vp?.description ?? '',
		rating: ( vp?.rating ?? 'G' ) as LibraryItem[ 'rating' ],
		displayEmbed: Boolean( vp?.display_embed ),
		allowDownloads: Boolean( vp?.allow_download ),
		shortcode: buildShortcode( vp?.guid, raw.media_details?.width, raw.media_details?.height ),
		sourceUrl: raw.source_url,
		isProcessing,
		// The media REST field omits `tracks` today, so this is seed-only:
		// the caption manager modal fetches the authoritative list itself.
		tracks: flattenVideoTracks( vp?.tracks ),
	};
}

/**
 * Fetch one raw page of /wp/v2/media results.
 *
 * @param args - Query args for addQueryArgs (page/per_page included).
 * @return The raw items plus the pagination headers.
 */
async function fetchMediaPage(
	args: Record< string, string | number >
): Promise< { raw: ApiMediaItem[]; totalItems: number; totalPages: number } > {
	const response = ( await apiFetch( {
		path: addQueryArgs( REST_PATH, args ),
		parse: false,
	} ) ) as Response;
	const totalItems = Number( response.headers.get( 'X-WP-Total' ) ?? 0 );
	const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) ?? 0 );
	const raw = ( await response.json() ) as ApiMediaItem[];
	return { raw, totalItems, totalPages };
}

/**
 * Drop non-video rows on WordPress.com Simple. The mime is the
 * discriminator on purpose: filtering on `jetpack_videopress.guid`
 * presence instead would let poster jpegs (which carry no guid)
 * masquerade as "local videos" — guid only labels videopress-vs-local
 * among actual videos.
 *
 * @param raw    - Raw media items from the REST API.
 * @param simple - Whether the dashboard runs on WordPress.com Simple.
 * @return The rows to map into LibraryItems.
 */
function keepOnlyVideos( raw: ApiMediaItem[], simple: boolean ): ApiMediaItem[] {
	if ( ! simple ) {
		return raw;
	}
	return raw.filter( item => item.mime_type?.startsWith( 'video/' ) );
}

/**
 * Fetch a page of VideoPress media items from the REST API.
 *
 * Every filter — privacy, type, search, date — is now a server-side WP_Query
 * constraint (on Simple via the videos-table ID sets resolved in the package's
 * `rest_attachment_query` PHP filter; off-Simple via mime + postmeta), so this
 * is always a single request whose `X-WP-Total` / `X-WP-TotalPages` headers are
 * exact. `keepOnlyVideos` stays as a cheap one-page safety net; it can't reduce
 * the totals since the server already restricted the query to `video/*`.
 *
 * @param view - The current DataViews view (sort, filters, search, pagination).
 * @return Items array and pagination metadata derived from response headers.
 */
async function fetchLibrary(
	view: View
): Promise< { items: LibraryItem[]; paginationInfo: PaginationInfo } > {
	const simple = isSimpleSite();
	const args = viewToQueryArgs( view );
	const { raw, totalItems, totalPages } = await fetchMediaPage( args );
	return {
		items: keepOnlyVideos( raw, simple ).map( item => toLibraryItem( item, simple ) ),
		paginationInfo: { totalItems, totalPages },
	};
}

export const LIBRARY_POLL_INTERVAL_MS = 2000;

// VIDP-298: cap how long the "still processing" poll runs. An orphaned
// wpcom Simple record can be stuck `isProcessing` forever (empty
// media_details, no backend transcode job to ever finish it), which would
// otherwise poll /wp/v2/media every 2s without bound. 15 minutes of
// continuous polling comfortably outlasts a real transcode, so a genuine
// upload is never cut off; a genuinely stuck record stops polling — and
// stops implying ongoing work — once the cap is hit.
export const PROCESSING_POLL_MAX_MS = 15 * 60 * 1000;

/**
 * Decide the library-list poll interval. Pure so the cap logic is testable
 * without wrangling react-query's timers.
 *
 * Polls every {@link LIBRARY_POLL_INTERVAL_MS} while at least one visible
 * item is still processing AND the current processing run has lasted under
 * {@link PROCESSING_POLL_MAX_MS}; otherwise returns false to stop the
 * interval (VIDP-298).
 *
 * @param hasProcessing - Whether any current item is still processing.
 * @param elapsedMs     - Time since processing first began for this query key.
 * @return The next poll interval in ms, or false to stop polling.
 */
export function libraryRefetchInterval(
	hasProcessing: boolean,
	elapsedMs: number
): number | false {
	if ( ! hasProcessing || elapsedMs >= PROCESSING_POLL_MAX_MS ) {
		return false;
	}
	return LIBRARY_POLL_INTERVAL_MS;
}

/**
 * Fetch and cache the VideoPress media library from /wp/v2/media.
 *
 * @param view - The current DataViews view (sort, filters, search, pagination).
 * @return Items, loading/error state, pagination info, and a refetch callback.
 */
export function useLibrary( view: View ) {
	// Anchor (per query key) for when the current processing run began, so the
	// VIDP-298 poll cap can measure elapsed time across refetches without
	// causing re-renders. Stored in a ref, not state, so mutating it never
	// re-runs the hook or the interval callback.
	const processingStartRef = useRef< { key: string; startedAt: number } | null >( null );

	const query = useQuery( {
		// Every filter (privacy, type, sort, search, page, perPage) is now
		// encoded in the server query args, so they alone key the cache.
		queryKey: [ LIBRARY_QUERY_KEY, viewToQueryArgs( view ) ],
		queryFn: () => fetchLibrary( view ),
		placeholderData: keepPreviousData,
		// While any item on the current page is still being processed by the
		// VideoPress backend (no poster yet / finished=false), re-fetch every
		// 2s so the placeholder is replaced as soon as the data is ready.
		// React-query pauses this when the tab is hidden, so it's cheap.
		// Capped after PROCESSING_POLL_MAX_MS of continuous processing so an
		// orphaned/stuck record can't poll forever (VIDP-298); the anchor is
		// keyed by queryHash so it resets when filters/page/search change.
		refetchInterval: q => {
			const hasProcessing = Boolean( q.state.data?.items.some( item => item.isProcessing ) );
			if ( ! hasProcessing ) {
				// Processing cleared (or never started) for this query — drop the
				// anchor so the next processing item gets a fresh time budget.
				if ( processingStartRef.current?.key === q.queryHash ) {
					processingStartRef.current = null;
				}
				return libraryRefetchInterval( false, 0 );
			}
			// First sighting of processing for this query key (or the key
			// changed): stamp the start so elapsed time is measured from here.
			if ( processingStartRef.current?.key !== q.queryHash ) {
				processingStartRef.current = { key: q.queryHash, startedAt: Date.now() };
			}
			return libraryRefetchInterval( true, Date.now() - processingStartRef.current.startedAt );
		},
	} );

	return {
		items: query.data?.items ?? [],
		isLoading: query.isLoading,
		paginationInfo: query.data?.paginationInfo ?? { totalItems: 0, totalPages: 0 },
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}

export const LIBRARY_QUERY_KEY = 'jetpack-videopress-library' as const;

// Second tuple segment of item-detail query keys
// ([ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, id ] — see use-video.ts).
// Shared so cache invalidation can address list vs item queries without
// re-encoding the key shape at each site.
export const LIBRARY_ITEM_QUERY_SEGMENT = 'item' as const;
