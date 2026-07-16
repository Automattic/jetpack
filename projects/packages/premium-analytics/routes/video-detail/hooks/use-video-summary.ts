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
	const { data, isLoading, isError, refetch } = useStatsSingleVideo( videoId );

	// The query's own refetch takes a react-query options object; expose a
	// no-arg wrapper so callers can pass it straight to event handlers.
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	return {
		title: data?.post?.title,
		publishedDate: data?.post?.date,
		isLoading,
		isError,
		refetch: retry,
	};
}
