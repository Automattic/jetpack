/**
 * External dependencies
 */
import { PanelBody, TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useVideoItem from '../../hooks/use-video-item';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';
const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

export default function DetailsControl( { id } ) {
	const [ videoItem, isRequestingVideoItem ] = useVideoItem( id );

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
				value={ videoItem?.title }
				placeholder={ __( 'Video title', 'jetpack' ) }
				onChange={ onTitleChangeHandler }
				disabled={ isRequestingVideoItem }
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack' ) }
				value={ videoItem?.description }
				placeholder={ __( 'Video description', 'jetpack' ) }
				onChange={ onDescriptionChangeHandler }
				disabled={ isRequestingVideoItem }
			/>
		</PanelBody>
	);
}
