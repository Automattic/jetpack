import { useInfiniteQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useMemo } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { IMPORT_QUERY_KEY } from './use-youtube-connection';

// Second query-key segment for the uploads-listing query
// ([ IMPORT_QUERY_KEY, VIDEOS_QUERY_SEGMENT, perPage ]).
export const VIDEOS_QUERY_SEGMENT = 'videos' as const;

/** Server default page size for the uploads listing. */
export const DEFAULT_VIDEOS_PER_PAGE = 20;

const VIDEOS_PATH = '/jetpack/v4/videopress/import/youtube/videos';

type ApiThumbnails = {
	default?: string | null;
	high?: string | null;
	maxres?: string | null;
};

type ApiYouTubeVideo = {
	external_id?: string;
	title?: string;
	description?: string;
	tags?: string[];
	duration_seconds?: number;
	privacy?: string;
	published_at?: string;
	thumbnails?: ApiThumbnails;
	already_imported?: boolean;
	attachment_id?: number | null;
};

type ApiVideosPage = {
	videos?: ApiYouTubeVideo[];
	next_page_token?: string | null;
};

export type YouTubeVideoPrivacy = 'public' | 'unlisted' | 'private';

export type YouTubeVideo = {
	externalId: string;
	title: string;
	description: string;
	tags: string[];
	durationSeconds: number;
	privacy: YouTubeVideoPrivacy;
	publishedAt: string;
	/** Best available thumbnail (maxres → high → default), null when none. */
	thumbnailUrl: string | null;
	/** True when a draft placeholder for this video already exists locally. */
	alreadyImported: boolean;
	/** The existing placeholder's attachment ID, when alreadyImported. */
	attachmentId: number | null;
};

export type YouTubeVideosPage = {
	videos: YouTubeVideo[];
	nextPageToken: string | null;
};

/**
 * Pick the best thumbnail from the listing's size variants. Mirrors the
 * server-side sideload preference (maxres → high → default) so what the
 * picker shows matches what the import stores.
 *
 * @param thumbnails - The raw thumbnails object, if any.
 * @return The best available URL, or null.
 */
function pickThumbnail( thumbnails?: ApiThumbnails ): string | null {
	return thumbnails?.maxres || thumbnails?.high || thumbnails?.default || null;
}

/**
 * Normalize a raw listing item to camelCase.
 *
 * @param raw - The raw video from the REST response.
 * @return The normalized YouTubeVideo.
 */
function toYouTubeVideo( raw: ApiYouTubeVideo ): YouTubeVideo {
	return {
		externalId: raw.external_id ?? '',
		title: raw.title ?? '',
		description: raw.description ?? '',
		tags: raw.tags ?? [],
		durationSeconds: raw.duration_seconds ?? 0,
		privacy: ( raw.privacy ?? 'public' ) as YouTubeVideoPrivacy,
		publishedAt: raw.published_at ?? '',
		thumbnailUrl: pickThumbnail( raw.thumbnails ),
		alreadyImported: Boolean( raw.already_imported ),
		attachmentId: raw.attachment_id ?? null,
	};
}

/**
 * Fetch one page of the connected channel's uploads.
 *
 * @param pageToken - Opaque cursor from the previous page; '' for the first.
 * @param number    - Page size.
 * @return The normalized page.
 */
async function fetchVideosPage( pageToken: string, number: number ): Promise< YouTubeVideosPage > {
	const args: Record< string, string | number > = { number };
	if ( pageToken ) {
		args.page_token = pageToken;
	}
	const raw = await apiFetch< ApiVideosPage >( { path: addQueryArgs( VIDEOS_PATH, args ) } );
	return {
		videos: ( raw?.videos ?? [] ).map( toYouTubeVideo ),
		nextPageToken: raw?.next_page_token ?? null,
	};
}

/**
 * Fetch and cache the connected YouTube channel's uploads as an infinite
 * list, cursoring on the server's opaque `next_page_token`.
 *
 * @param options         - Hook options.
 * @param options.number  - Page size (default 20, server max 50).
 * @param options.enabled - Set false to hold off fetching (e.g. while disconnected).
 * @return The flattened videos plus infinite-query controls.
 */
export function useYouTubeVideos( options: { number?: number; enabled?: boolean } = {} ) {
	const number = options.number ?? DEFAULT_VIDEOS_PER_PAGE;

	const query = useInfiniteQuery( {
		queryKey: [ IMPORT_QUERY_KEY, VIDEOS_QUERY_SEGMENT, number ],
		initialPageParam: '',
		queryFn: ( { pageParam } ) => fetchVideosPage( pageParam, number ),
		// A null next_page_token means the last page; undefined tells
		// TanStack there is no next page (hasNextPage → false).
		getNextPageParam: lastPage => lastPage.nextPageToken ?? undefined,
		enabled: options.enabled ?? true,
	} );

	const pages = query.data?.pages;
	const videos = useMemo( () => pages?.flatMap( page => page.videos ) ?? [], [ pages ] );

	return {
		videos,
		fetchNextPage: query.fetchNextPage,
		hasNextPage: query.hasNextPage,
		isFetchingNextPage: query.isFetchingNextPage,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
