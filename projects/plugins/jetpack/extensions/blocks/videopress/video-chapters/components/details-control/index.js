/**
 * External dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';
const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

export default function DetailsControl() {
	if ( ! isVideoChaptersEnabled ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Details', 'jetpack' ) }>
			<p>{ __( 'Video description', 'jetpack' ) }</p>
		</PanelBody>
	);
}
