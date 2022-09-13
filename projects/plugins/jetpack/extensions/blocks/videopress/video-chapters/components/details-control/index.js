/**
 * External dependencies
 */
import { PanelBody, TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';
const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

export default function DetailsControl( { title, description } ) {
	if ( ! isVideoChaptersEnabled ) {
		return null;
	}

	const onTitleChangeHandler = () => {
		// @todo
	};

	const onDescriptionChangeHandler = () => {
		// @todo
	};

	return (
		<PanelBody title={ __( 'Details', 'jetpack' ) }>
			<TextControl
				label={ __( 'Title', 'jetpack' ) }
				value={ title }
				placeholder={ __( 'Video title', 'jetpack' ) }
				onChange={ onTitleChangeHandler }
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack' ) }
				value={ description }
				placeholder={ __( 'Video description', 'jetpack' ) }
				onChange={ onDescriptionChangeHandler }
			/>
		</PanelBody>
	);
}
