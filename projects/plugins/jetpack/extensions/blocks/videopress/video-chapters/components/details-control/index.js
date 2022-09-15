/**
 * External dependencies
 */
import { PanelBody, TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useBlockAttributes from '../../hooks/use-block-attributes';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';
const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

export default function DetailsControl( { isRequestingVideoItem } ) {
	const { attributes, setAttributes } = useBlockAttributes();

	if ( ! isVideoChaptersEnabled ) {
		return null;
	}

	const { title, description } = attributes;

	const onTitleChangeHandler = newTitle => {
		setAttributes( { title: newTitle } );
	};

	const onDescriptionChangeHandler = newDescription => {
		setAttributes( { description: newDescription } );
	};

	return (
		<PanelBody title={ __( 'Details', 'jetpack' ) }>
			<TextControl
				label={ __( 'Title', 'jetpack' ) }
				value={ title }
				placeholder={ __( 'Video title', 'jetpack' ) }
				onChange={ onTitleChangeHandler }
				disabled={ isRequestingVideoItem }
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack' ) }
				value={ description }
				placeholder={ __( 'Video description', 'jetpack' ) }
				onChange={ onDescriptionChangeHandler }
				disabled={ isRequestingVideoItem }
			/>
		</PanelBody>
	);
}
