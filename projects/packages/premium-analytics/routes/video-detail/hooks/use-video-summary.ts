/**
 * External dependencies
 */
import { useStatsSingleVideo } from '@jetpack-premium-analytics/data';
import { useCallback } from '@wordpress/element';

export type VideoSummary = {
	title?: string;
	publishedDate?: string;
	isLoading: boolean;
	/** Whether the single-video request failed — the page must not present a fallback title as real data. */
	isError: boolean;
	/** Whether the resolved attachment is missing or is known not to be a video. */
	isNotFound: boolean;
	/** Re-runs the failed request, for the error state's Retry action. */
	refetch: () => void;
};

/**
 * Resolve the title and publication date for a single VideoPress attachment.
 *
 * @param videoId - The attachment post ID from the route.
 * @return The resolved video summary.
 */
export function useVideoSummary( videoId: number ): VideoSummary {
	const { data, isLoading, isError, isSuccess, refetch } = useStatsSingleVideo( videoId );
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
		isLoading,
		isError,
		isNotFound: isSuccess && ( ! hasValidId || ! isVideoMimeType ),
		refetch: retry,
	};
}
