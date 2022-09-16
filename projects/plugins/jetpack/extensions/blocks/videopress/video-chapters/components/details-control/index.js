/**
 * External dependencies
 */
import { PanelBody, TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { isBetaExtension } from '../../../../../editor';
import useBlockAttributes from '../../hooks/use-block-attributes';
import './index.scss';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';
const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

const CHARACTERS_PER_LINE = 31;

export default function DetailsControl( { isRequestingVideoItem } ) {
	const { attributes, setAttributes } = useBlockAttributes();
	const { title, description } = attributes;
	const isBeta = isBetaExtension( VIDEOPRESS_VIDEO_CHAPTERS_FEATURE );

	// Expands the description textarea to accommodate the description
	const rows = description
		.split( '\n' )
		.map( line => Math.ceil( line.length / CHARACTERS_PER_LINE ) || 1 )
		.reduce( ( sum, current ) => sum + current, 0 );
	const maxRows = 20;
	const minRows = 4;
	const descriptionControlRows = Math.min( maxRows, Math.max( rows, minRows ) );

	if ( ! isVideoChaptersEnabled ) {
		return null;
	}

	const setTitleAttribute = newTitle => {
		setAttributes( { title: newTitle } );
	};

	const setDescriptionAttribute = newDescription => {
		setAttributes( { description: newDescription } );
	};

	return (
		<PanelBody title={ __( 'Details', 'jetpack' ) } className={ isBeta ? 'is-beta' : '' }>
			<TextControl
				label={ __( 'Title', 'jetpack' ) }
				value={ title }
				placeholder={ __( 'Video title', 'jetpack' ) }
				onChange={ setTitleAttribute }
				disabled={ isRequestingVideoItem }
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack' ) }
				value={ description }
				placeholder={ __( 'Video description', 'jetpack' ) }
				onChange={ setDescriptionAttribute }
				disabled={ isRequestingVideoItem }
				rows={ descriptionControlRows }
			/>
		</PanelBody>
	);
}
