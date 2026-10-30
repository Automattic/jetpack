/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
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
	notFoundDescription: () => __( "We couldn't find this video.", 'jetpack-premium-analytics-pkg' ),
};

export { useVideoSummary, videoHeaderSlots, type VideoSummary };
