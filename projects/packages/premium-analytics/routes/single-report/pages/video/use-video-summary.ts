/**
 * External dependencies
 */
import { useStatsSingleVideo } from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { EntitySummary } from '../adapter';

export type VideoSummary = EntitySummary & {
	/** The upload date, as the report states it. */
	publishedDate?: string;
	/** The video's poster-frame URL, when the endpoint returns a safe http(s) one. */
	posterUrl?: string;
};

/**
 * Resolve the title and publication date for a single VideoPress attachment.
 *
 * @param videoId - The attachment post ID from the route.
 * @return The resolved video summary.
 */
export function useVideoSummary( videoId: number ): VideoSummary {
	const { data, isLoading, isPending, isPaused, isError, error, isSuccess, refetch } =
		useStatsSingleVideo( videoId );
	const post = data?.post;
	const hasValidId = Number.isInteger( post?.id ) && Number( post?.id ) > 0;
	// Require a `video/` prefix so non-video IDs (images, posts, pages) resolve to
	// not-found. Videos are `video/videopress` on Jetpack/Atomic and their original
	// mime (`video/mp4`, `video/quicktime`, …) on Simple, so match the prefix.
	const mimeType = post?.mimeType?.trim();
	const isVideoMimeType = Boolean( mimeType && mimeType.startsWith( 'video/' ) );

	// The query's own refetch takes a react-query options object; expose a
	// no-arg wrapper so callers can pass it straight to event handlers.
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	return {
		title: post?.title,
		publishedDate: post?.date,
		allTimeStart: post?.date,
		// The poster is remote report data used verbatim as an image source, so
		// it goes through the shared http(s) guard like every other report URL.
		posterUrl: safeHttpUrl( post?.poster ) ?? undefined,
		// Counts a paused first load, as `usePostSummary` does.
		isLoading: isLoading || ( isPending && isPaused ),
		isError,
		error,
		isNotFound: isSuccess && ( ! hasValidId || ! isVideoMimeType ),
		refetch: retry,
	};
}
