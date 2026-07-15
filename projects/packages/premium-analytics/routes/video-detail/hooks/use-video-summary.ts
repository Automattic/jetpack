/**
 * External dependencies
 */
import { useStatsSingleVideo } from '@jetpack-premium-analytics/data';

export type VideoSummary = {
	title?: string;
	publishedDate?: string;
	isLoading: boolean;
};

/**
 * Resolve the title and publication date for a single VideoPress attachment.
 *
 * @param videoId - The attachment post ID from the route.
 * @return The resolved video summary.
 */
export function useVideoSummary( videoId: number ): VideoSummary {
	const { data, isLoading } = useStatsSingleVideo( videoId );

	return {
		title: data?.post?.title,
		publishedDate: data?.post?.date,
		isLoading,
	};
}
