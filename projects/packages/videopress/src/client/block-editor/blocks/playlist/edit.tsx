/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, PanelBody, Placeholder, TextControl, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, closeSmall } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { isVideoPressGuid, pickGUIDFromUrl } from '../../../lib/url';
import { VideoPressIcon } from '../video/components/icons';
import './editor.scss';
/**
 * Types
 */
import type { PlaylistBlockAttributes, PlaylistVideo } from './types';
import type { BlockEditProps } from '@wordpress/blocks';

/**
 * Extract a VideoPress GUID from user input, which can be
 * either a bare GUID or any recognized VideoPress URL.
 *
 * @param value - Raw user input.
 * @return The GUID, or null when the input is not recognized.
 */
function parseVideoInput( value: string ): string | null {
	const trimmed = value.trim();
	if ( ! trimmed ) {
		return null;
	}

	const guid = isVideoPressGuid( trimmed );
	if ( guid ) {
		return guid as string;
	}

	return pickGUIDFromUrl( trimmed );
}

/**
 * VideoPress Playlist block Edit component.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attributes setter.
 * @return React component.
 */
export default function PlaylistBlockEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< PlaylistBlockAttributes > ) {
	const { videos, autoAdvance, loop } = attributes;
	const [ currentIndex, setCurrentIndex ] = useState( 0 );
	const [ newVideoInput, setNewVideoInput ] = useState( '' );
	const [ inputError, setInputError ] = useState( false );

	const blockProps = useBlockProps( { className: 'videopress-playlist-editor' } );

	const currentVideo = videos[ currentIndex ] ?? videos[ 0 ];

	const addVideo = () => {
		const guid = parseVideoInput( newVideoInput );
		if ( ! guid ) {
			setInputError( true );
			return;
		}

		setAttributes( { videos: [ ...videos, { guid } ] } );
		setNewVideoInput( '' );
		setInputError( false );
	};

	const removeVideo = ( index: number ) => {
		setAttributes( { videos: videos.filter( ( _, i ) => i !== index ) } );
		if ( currentIndex >= index && currentIndex > 0 ) {
			setCurrentIndex( currentIndex - 1 );
		}
	};

	const moveVideo = ( index: number, direction: -1 | 1 ) => {
		const target = index + direction;
		if ( target < 0 || target >= videos.length ) {
			return;
		}

		const reordered = [ ...videos ];
		[ reordered[ index ], reordered[ target ] ] = [ reordered[ target ], reordered[ index ] ];
		setAttributes( { videos: reordered } );

		if ( currentIndex === index ) {
			setCurrentIndex( target );
		} else if ( currentIndex === target ) {
			setCurrentIndex( index );
		}
	};

	const updateVideoTitle = ( index: number, title: string ) => {
		const updated = videos.map( ( video: PlaylistVideo, i: number ) =>
			i === index ? { ...video, title } : video
		);
		setAttributes( { videos: updated } );
	};

	const addVideoForm = (
		<div className="videopress-playlist-editor__add">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Add video', 'jetpack-videopress-pkg' ) }
				hideLabelFromVision
				placeholder={ __( 'VideoPress GUID or URL', 'jetpack-videopress-pkg' ) }
				value={ newVideoInput }
				onChange={ ( value: string ) => {
					setNewVideoInput( value );
					setInputError( false );
				} }
				onKeyDown={ event => {
					if ( event.key === 'Enter' ) {
						event.preventDefault();
						addVideo();
					}
				} }
				help={
					inputError
						? __( 'Enter a VideoPress GUID or a VideoPress video URL.', 'jetpack-videopress-pkg' )
						: undefined
				}
			/>
			<Button __next40pxDefaultSize variant="secondary" onClick={ addVideo }>
				{ __( 'Add to playlist', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);

	if ( ! videos.length ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ VideoPressIcon }
					label={ __( 'VideoPress Playlist', 'jetpack-videopress-pkg' ) }
					instructions={ __(
						'Add VideoPress videos by GUID or URL to build a playlist that plays them in sequence.',
						'jetpack-videopress-pkg'
					) }
				>
					{ addVideoForm }
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Playlist settings', 'jetpack-videopress-pkg' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Autoplay next video', 'jetpack-videopress-pkg' ) }
						help={ __(
							'Automatically play the next video when the current one ends.',
							'jetpack-videopress-pkg'
						) }
						checked={ autoAdvance }
						onChange={ ( value: boolean ) => setAttributes( { autoAdvance: value } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Loop playlist', 'jetpack-videopress-pkg' ) }
						help={ __(
							'Restart from the first video after the last one ends.',
							'jetpack-videopress-pkg'
						) }
						checked={ loop }
						onChange={ ( value: boolean ) => setAttributes( { loop: value } ) }
					/>
				</PanelBody>
			</InspectorControls>

			{ currentVideo && (
				<div className="videopress-playlist-editor__player-wrapper">
					<iframe
						className="videopress-playlist-editor__player"
						title={ __( 'VideoPress Playlist Player', 'jetpack-videopress-pkg' ) }
						src={ `https://videopress.com/embed/${ currentVideo.guid }?cover=1&preloadContent=metadata` }
						allowFullScreen
						allow="clipboard-write"
					/>
				</div>
			) }

			<ol className="videopress-playlist-editor__items">
				{ videos.map( ( video: PlaylistVideo, index: number ) => (
					<li
						key={ `${ video.guid }-${ index }` }
						className={
							index === currentIndex
								? 'videopress-playlist-editor__item is-current'
								: 'videopress-playlist-editor__item'
						}
					>
						<Button
							className="videopress-playlist-editor__item-select"
							onClick={ () => setCurrentIndex( index ) }
							label={ sprintf(
								/* translators: %d: position of the video in the playlist. */
								__( 'Preview video %d', 'jetpack-videopress-pkg' ),
								index + 1
							) }
						>
							{ index + 1 }.
						</Button>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							className="videopress-playlist-editor__item-title"
							label={ __( 'Video title', 'jetpack-videopress-pkg' ) }
							hideLabelFromVision
							placeholder={ video.guid }
							value={ video.title ?? '' }
							onChange={ ( value: string ) => updateVideoTitle( index, value ) }
						/>
						<Button
							icon={ chevronUp }
							disabled={ index === 0 }
							onClick={ () => moveVideo( index, -1 ) }
							label={ __( 'Move up', 'jetpack-videopress-pkg' ) }
						/>
						<Button
							icon={ chevronDown }
							disabled={ index === videos.length - 1 }
							onClick={ () => moveVideo( index, 1 ) }
							label={ __( 'Move down', 'jetpack-videopress-pkg' ) }
						/>
						<Button
							icon={ closeSmall }
							onClick={ () => removeVideo( index ) }
							label={ __( 'Remove from playlist', 'jetpack-videopress-pkg' ) }
						/>
					</li>
				) ) }
			</ol>

			{ addVideoForm }
		</div>
	);
}
