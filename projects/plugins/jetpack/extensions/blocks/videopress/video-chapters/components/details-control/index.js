/**
 * External dependencies
 */
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useState, createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { isBetaExtension } from '../../../../../editor';
/**
 * Internal dependencies
 */
import useBlockAttributes from '../../hooks/use-block-attributes';
import { extractVideoChapters } from '../../utils/extract-video-chapters';
import { getIsoLangs } from '../../utils/languages';

const VIDEOPRESS_VIDEO_CHAPTERS_FEATURE = 'videopress/video-chapters';
const isVideoChaptersEnabled = !! window?.Jetpack_Editor_Initial_State?.available_blocks[
	VIDEOPRESS_VIDEO_CHAPTERS_FEATURE
];

const CHARACTERS_PER_LINE = 31;

function getChaptersByLanguage( tracks = [], ln ) {
	return tracks.find( track => track?.srcLang === ln );
}

function VideoChaptersSubPanel( { updateDataToSync, dataToSync } ) {
	const { attributes, setAttributes } = useBlockAttributes();
	const { videoPressTracks } = attributes;
	const [ language, setLanguage ] = useState( 'en' );
	const { langsToSync = [] } = dataToSync;

	// Populate the chapters list with the new language.
	function addToChaptersList( newChapter ) {
		setAttributes( { videoPressTracks: [ ...videoPressTracks, newChapter ] } );
	}

	/**
	 * Update the chapters items,
	 * based on the current language selected.
	 *
	 * @param {object} options - The options object.
	 */
	function updateChaptersList( options ) {
		setAttributes( {
			videoPressTracks: videoPressTracks.map( track => {
				if ( track?.srcLang === language ) {
					return {
						...track,
						...options,
						srcLang: language,
					};
				}

				return track;
			} ),
		} );
	}

	const currentChapter = getChaptersByLanguage( videoPressTracks, language );
	const hasChaptersForLanguage = !! ( currentChapter && currentChapter?.src );

	return (
		<>
			<TextControl
				label={ __( 'Title of track', 'jetpack' ) }
				value={ currentChapter?.label || '' }
				onChange={ newLabel => {
					updateChaptersList( {
						label: newLabel,
					} );
				} }
			/>

			<SelectControl
				label={ __( 'Language', 'jetpack' ) }
				value={ language }
				options={ getIsoLangs() }
				onChange={ newLn => {
					setLanguage( newLn );
					if ( ! getChaptersByLanguage( videoPressTracks, newLn ) ) {
						addToChaptersList( {
							kind: 'chapters',
							srcLang: newLn,
						} );
					}
				} }
			/>

			{ hasChaptersForLanguage && (
				<ToggleControl
					label={ __( 'Overwrite chapters', 'jetpack' ) }
					checked={ langsToSync.includes( language ) }
					onChange={ () => {
						if ( langsToSync.includes( language ) ) {
							return updateDataToSync( {
								langsToSync: langsToSync.filter( ln => ln !== language ),
							} );
						}

						updateDataToSync( { langsToSync: [ ...langsToSync, language ] } );
					} }
					help={
						hasChaptersForLanguage
							? createInterpolateElement(
									sprintf(
										// translators: %s is the language tag (en, fr, etc.)
										__( 'Already exists chapters for <strong>%s</strong> language', 'jetpack' ),
										currentChapter.srcLang
									),
									{
										strong: <strong />,
									}
							  )
							: null
					}
				/>
			) }
		</>
	);
}
export default function DetailsControl( { isRequestingVideoItem, updateDataToSync, dataToSync } ) {
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

	const descriptionHasChapters = description?.length && extractVideoChapters( description )?.length;

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
				help={ descriptionHasChapters ? __( 'Video chapters detected', 'jetpack' ) : null }
			/>
			{ descriptionHasChapters && (
				<VideoChaptersSubPanel updateDataToSync={ updateDataToSync } dataToSync={ dataToSync } />
			) }
		</PanelBody>
	);
}
