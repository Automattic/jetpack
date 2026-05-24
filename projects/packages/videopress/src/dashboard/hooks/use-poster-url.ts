import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import type { LibraryItem } from '../types/library';

const PLAYBACK_JWT_PATH = '/wpcom/v2/videopress/playback-jwt';
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

type PlaybackJwtResponse = { playback_token?: string };

/**
 * Fetch a short-lived playback JWT for a VideoPress GUID. The token is
 * required to access poster (and stream) URLs of private videos and is
 * appended as `?metadata_token=<jwt>` to those URLs.
 *
 * The query is keyed by guid alone so concurrent renders of the same
 * private video (e.g. multiple rows of the same library) share one
 * request, and the token is cached for ~24h to match the JWT lifetime.
 *
 * @param guid    - VideoPress GUID, or '' for non-VideoPress items.
 * @param enabled - Skip the request when false (e.g. for public videos).
 * @return The token (or undefined while loading / disabled).
 */
export function usePlaybackToken( guid: string, enabled: boolean ): string | undefined {
	const query = useQuery( {
		queryKey: [ 'videopress-playback-token', guid ],
		queryFn: async () => {
			const res = await apiFetch< PlaybackJwtResponse >( {
				path: `${ PLAYBACK_JWT_PATH }/${ guid }`,
				method: 'POST',
			} );
			return res.playback_token ?? '';
		},
		enabled: enabled && Boolean( guid ),
		staleTime: ONE_DAY_MS,
		gcTime: ONE_DAY_MS,
	} );
	return query.data;
}

/**
 * Resolve a video's poster URL, signing it with a playback JWT when the
 * video is private. Returns null while the token is still in flight so
 * the caller can render nothing rather than a broken image.
 *
 * @param video - The library item whose poster URL is needed.
 * @return The poster URL ready to use as an <img> src, or null.
 */
export function usePosterUrl( video: LibraryItem ): string | null {
	const { thumbnailUrl, isPrivate, guid } = video;
	const token = usePlaybackToken( guid, isPrivate );

	if ( ! thumbnailUrl || ( isPrivate && ! token ) ) {
		return null;
	}
	return isPrivate ? `${ thumbnailUrl }?metadata_token=${ token }` : thumbnailUrl;
}
