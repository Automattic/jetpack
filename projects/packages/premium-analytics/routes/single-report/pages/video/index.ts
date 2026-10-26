/**
 * Internal dependencies
 */
import { useVideoSummary } from './use-video-summary';
import { videoHeaderSlots } from './video-header-slots';
import type { SingleReportAdapter } from '../adapter';
import type { VideoSummary } from './use-video-summary';

/**
 * The video page: the VideoPress attachment's title, poster and upload date, from the
 * single-video Stats report.
 */
export const videoAdapter: SingleReportAdapter< VideoSummary > = {
	useSummary: useVideoSummary,
	headerSlots: videoHeaderSlots,
};

export { useVideoSummary, videoHeaderSlots, type VideoSummary };
