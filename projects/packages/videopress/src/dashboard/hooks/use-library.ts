import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';
import { flattenVideoTracks } from '../../client/lib/video-tracks';
import { pickPlaybackUrl } from '../../client/utils/video-chapters/pick-playback-url';
import { buildShortcode } from '../utils/format';
import type { VideoTracksResponseBodyProps } from '../../client/types';
import type { LibraryItem, LibraryItemPrivacy } from '../types/library';
import type { View } from '@wordpress/dataviews';

const REST_PATH = '/wp/v2/media';

// The raw /wp/v2/media item shape consumed by toLibraryItem. Shared with
// use-video.ts, which fetches a single item from the same endpoint.
export type ApiMediaItem = {
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
		videopress?: {
			duration?: number;
			poster?: string;
			finished?: boolean;
			file_url_base?: { https?: string };
			files?: Record< string, { mp4?: string } >;
		};
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
		page: view.page ?? 1,
		per_page: view.perPage ?? 12,
	};
	if ( ! simple ) {
		args.media_type = 'video';
		args.mime_type = 'video/*';
		// Hide local attachments that already have a VideoPress sibling (they
		// carry the `_videopress_uploaded_id` post-meta). The sibling is the
		// row we want to surface; the original local is a leftover that would
		// let users try to re-upload it. Off-Simple only: the meta is written
		// by the videopress/v1 promote flow, which can't run on Simple, and
		// the wpcom filter branch doesn't implement the param.
		args.videopress_hide_already_uploaded = 1;
	} else {
		// `media_type` is rejected (HTTP 400) and `mime_type=video/*` doesn't
		// narrow the query on Simple; this custom param is handled by the
		// package's PHP `rest_attachment_query` filter (post_mime_type LIKE
		// 'video/%'), keeping the X-WP-Total headers exact.
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
 * The single media mapper for the dashboard — the library list and the video
 * detail view (use-video.ts) consume the same endpoint and must map it
 * identically, Simple media-shape branch included.
 *
 * @param raw    - The raw media item from the REST API response.
 * @param simple - Whether the dashboard is running on WordPress.com Simple (drives the media-shape branch).
 * @return A normalized LibraryItem for the VideoPress library UI.
 */
export function toLibraryItem( raw: ApiMediaItem, simple: boolean ): LibraryItem {
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
	// Orientation is derived from the source dimensions; unknown (missing
	// dimensions) and square videos carry no orientation.
	const { width, height } = details ?? {};
	let orientation: LibraryItem[ 'orientation' ] = null;
	if ( width && height && width !== height ) {
		orientation = width > height ? 'landscape' : 'portrait';
	}
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
		playbackUrl: pickPlaybackUrl( vpDetails ),
		isProcessing,
		orientation,
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
 * Fetch a page of VideoPress media items from the REST API.
 *
 * Every filter — privacy, type, search, date — is a server-side WP_Query
 * constraint (on Simple via the videos-table ID sets resolved in the package's
 * `rest_attachment_query` PHP filter, which also restricts the query to
 * `post_mime_type` video; off-Simple via mime + postmeta), so this is always a
 * single request whose rows match its exact `X-WP-Total` / `X-WP-TotalPages`
 * headers. No client-side re-filtering: dropping a row here couldn't fix the
 * server-derived totals, only desynchronize the two.
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
		items: raw.map( item => toLibraryItem( item, simple ) ),
		paginationInfo: { totalItems, totalPages },
	};
}

export const LIBRARY_POLL_INTERVAL_MS = 2000;

// VIDP-298: cap how long the "still processing" poll runs. An orphaned
// wpcom Simple record can be stuck `isProcessing` forever (empty
// media_details, no backend transcode job to ever finish it), which would
// otherwise poll /wp/v2/media every 2s without bound. Each distinct set of
// processing items gets 15 minutes of wall-clock polling — comfortably past
// a typical transcode — so a stuck record stops polling (and stops implying
// ongoing work) without starving a later upload of its own budget. A
// transcode that genuinely outlasts the cap still resolves via the
// while-processing focus refetch in useLibrary/useVideo.
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
 * @param elapsedMs     - Time since the current processing set was first seen.
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

export type ProcessingPollAnchor = {
	/** Sorted, comma-joined ids of the items that were processing when stamped. */
	idsKey: string;
	startedAt: number;
};

/**
 * Advance the processing-poll anchor and decide the next poll interval.
 *
 * The anchor pins when the CURRENT set of processing items was first seen,
 * and re-stamps whenever that set changes — a new upload appearing, or one of
 * several finishing — so every distinct set gets a fresh
 * {@link PROCESSING_POLL_MAX_MS} budget. Without this, a permanently-stuck
 * orphan (the VIDP-298 case) would burn the budget once and then starve every
 * later upload of polling. The budget is keyed by the SET, not the view: the
 * same stuck orphan seen through different filters/pages/searches keeps one
 * budget instead of re-arming on every view change. (Passing through a view
 * with no processing items — or a remount — drops the anchor and re-arms;
 * that's bounded by user action, which is fine: the cap exists to stop
 * unbounded *idle* polling.) Pure so the cap behavior is unit-testable
 * without wrangling react-query's timers.
 *
 * @param anchor        - The previously stored anchor, or null.
 * @param processingIds - Ids of the items currently processing (any order).
 * @param now           - Current epoch ms.
 * @return The anchor to store and the poll interval (false stops polling).
 */
export function nextProcessingPoll(
	anchor: ProcessingPollAnchor | null,
	processingIds: string[],
	now: number
): { anchor: ProcessingPollAnchor | null; interval: number | false } {
	if ( processingIds.length === 0 ) {
		// Processing cleared (or never started) — drop the anchor so the next
		// processing item gets a fresh budget.
		return { anchor: null, interval: libraryRefetchInterval( false, 0 ) };
	}
	const idsKey = [ ...processingIds ].sort().join( ',' );
	if ( anchor?.idsKey !== idsKey ) {
		anchor = { idsKey, startedAt: now };
	}
	return { anchor, interval: libraryRefetchInterval( true, now - anchor.startedAt ) };
}

/**
 * Fetch and cache the VideoPress media library from /wp/v2/media.
 *
 * @param view - The current DataViews view (sort, filters, search, pagination).
 * @return Items, loading/error state, pagination info, and a refetch callback.
 */
export function useLibrary( view: View ) {
	// Anchor for when the current processing set was first seen, so the
	// VIDP-298 poll cap can measure elapsed time across refetches without
	// causing re-renders. Stored in a ref, not state, so mutating it never
	// re-runs the hook or the interval callback.
	const processingStartRef = useRef< ProcessingPollAnchor | null >( null );

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
		// Capped per processing set after PROCESSING_POLL_MAX_MS so an
		// orphaned/stuck record can't poll forever (VIDP-298); see
		// nextProcessingPoll for the anchor semantics.
		refetchInterval: q => {
			const { anchor, interval } = nextProcessingPoll(
				processingStartRef.current,
				( q.state.data?.items ?? [] ).filter( item => item.isProcessing ).map( item => item.id ),
				Date.now()
			);
			processingStartRef.current = anchor;
			return interval;
		},
		// The dashboard disables focus refetches globally, but while something
		// is processing a return to the tab is exactly when the user expects
		// fresh state — and it's the recovery path once the poll cap above has
		// fired: a transcode that genuinely outlasts the cap flips to ready on
		// the next focus instead of never.
		refetchOnWindowFocus: q => Boolean( q.state.data?.items.some( item => item.isProcessing ) ),
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
