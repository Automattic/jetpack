/**
 * External dependencies
 */
import {
	WidgetRoot,
	WidgetState,
	describeError,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import PreviewPlayer from '../../src/dashboard/components/video-details/preview-player';
import { useVideoAttachment } from './use-video-attachment';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

/** No attributes of its own: the video report names the attachment through `reportParams`. */
export type VideoPlayerAttributes = Record< never, never >;

type VideoPlayerRenderAttributes = VideoPlayerAttributes & Partial< ReportParamsFieldAttributes >;

type VideoPlayerWidgetProps = WidgetRenderProps< VideoPlayerRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Resolve `reportParams.post_id` to the attachment id.
 *
 * @param value - The raw report param.
 * @return The attachment id, or 0 when the page names no video.
 */
function toVideoId( value: unknown ): number {
	const parsed =
		typeof value === 'number' || typeof value === 'string' ? Number( value ) : Number.NaN;

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : 0;
}

/**
 * Plays the video the report is about, through the dashboard's own player.
 *
 * @return The player, or the state that stands in for it.
 */
function VideoPlayerReport() {
	const { reportParams } = useWidgetRootContext();
	const videoId = toVideoId( reportParams?.post_id );
	const { video, isLoading, isError, error, refetch } = useVideoAttachment( videoId );

	const conversionFailed = Boolean( video?.conversionFailed );
	const isPlayable = Boolean( video?.guid || video?.sourceUrl );

	return (
		<WidgetState
			isLoading={ isLoading }
			isError={ isError || conversionFailed }
			error={
				conversionFailed
					? {
							description: __(
								'Conversion failed. Delete this video and upload it again.',
								'jetpack-videopress-pkg'
							),
						}
					: describeError( error, {
							retryDescription: __(
								"We couldn't load this video. Please try again in a moment.",
								'jetpack-videopress-pkg'
							),
							onRetry: refetch,
						} )
			}
			isEmpty={ videoId <= 0 || ( video !== null && ! isPlayable ) }
			empty={ {
				description:
					videoId <= 0
						? __( 'Open a video to play it here.', 'jetpack-videopress-pkg' )
						: __( "This video isn't ready to play yet.", 'jetpack-videopress-pkg' ),
			} }
		>
			{ video && <PreviewPlayer video={ video } /> }
		</WidgetState>
	);
}

/**
 * Video player widget.
 *
 * @param props            - Widget render props.
 * @param props.attributes - Host attributes.
 * @param props.setError   - Dashboard error handler.
 * @return The widget.
 */
export default function VideoPlayer( { attributes = {}, setError }: VideoPlayerWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<VideoPlayerReport />
		</WidgetRoot>
	);
}
