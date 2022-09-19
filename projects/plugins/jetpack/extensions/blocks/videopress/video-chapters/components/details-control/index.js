/**
 * External dependencies
 */
import { PanelBody, TextareaControl, TextControl, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { isBetaExtension } from '../../../../../editor';
/**
 * Internal dependencies
 */
import useBlockAttributes from '../../hooks/use-block-attributes';
import { extractVideoChapters } from '../../utils/extract-video-chapters';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';
const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

const CHARACTERS_PER_LINE = 31;

function VideoChaptersSubPanel() {
	const { attributes, setAttributes } = useBlockAttributes();
	const { videoPressTracks } = attributes;
	const [ language, setLanguage ] = useState( '' );

	function getChaptersByLanguage( ln ) {
		return videoPressTracks?.find( track => track?.srcLang === ln );
	}

	const chapterByLanguage = getChaptersByLanguage( language );

	function updateCurrentChaptersItem( options ) {
		if ( ! chapterByLanguage ) {
			return;
		}

		setAttributes( {
			videoPressTracks: videoPressTracks.map( track => {
				if ( track?.srcLang === language ) {
					return {
						...track,
						...options,
					};
				}

				return track;
			} ),
		} );
	}

	return (
		<>
			<p>{ __( 'Video chapters detected.', 'jetpack' ) }</p>

			<TextControl
				label={ __( 'Title of track', 'jetpack' ) }
				value={ chapterByLanguage?.label }
				onChange={ newLabel => {
					updateCurrentChaptersItem( {
						label: newLabel,
					} );
				} }
			/>

			<TextControl
				label={ __( 'Language tag (en, fr, etc.)', 'jetpack' ) }
				value={ language }
				onChange={ setLanguage }
			/>

			{ chapterByLanguage && (
				<ToggleControl
					label={ __( 'Overwrite chapters', 'jetpack' ) }
					onChange={ () => {
						updateCurrentChaptersItem( {
							overwrite: ! chapterByLanguage.overwrite,
						} );
					} }
					checked={ chapterByLanguage?.overwrite }
					help={ sprintf(
						// translators: %s is the language tag (en, fr, etc.)
						__( 'Already exist chapers for %s language. Overwrite?', 'jetpack' ),
						chapterByLanguage.srcLang
					) }
				/>
			) }
		</>
	);
}

export default function DetailsControl( { isRequestingVideoItem } ) {
	const { attributes, setAttributes } = useBlockAttributes();
	const { title, description } = attributes;
	const isBeta = isBetaExtension( VIDEOPRESS_VIDEO_CHAPTERS_FEATURE );

	// Expands the description textarea to accommodate the description
	const minRows = 4;
	const maxRows = 12;
	const rows = description?.length
		? description
				.split( '\n' )
				.map( line => Math.ceil( line.length / CHARACTERS_PER_LINE ) || 1 )
				.reduce( ( sum, current ) => sum + current, 0 )
		: minRows;

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

	const descriptionHasChapters = description && extractVideoChapters( description );

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
			{ descriptionHasChapters?.length && <VideoChaptersSubPanel /> }
		</PanelBody>
	);
}
