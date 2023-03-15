/**
 *External dependencies
 */
import { MediaUploadCheck, MediaUpload } from '@wordpress/block-editor';
import {
	MenuItem,
	PanelBody,
	NavigableMenu,
	Dropdown,
	Button,
	ToggleControl,
	SandBox,
} from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { linkOff, image as imageIcon } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import TimestampControl from '../../../../../components/timestamp-control';
import { getVideoPressUrl } from '../../../../../lib/url';
import { usePreview } from '../../../../hooks/use-preview';
import { VIDEO_POSTER_ALLOWED_MEDIA_TYPES } from '../../constants';
import { PosterPanelProps, VideoControlProps, VideoGUID } from '../../types';
import { VideoPosterCard } from '../poster-image-block-control';
import './style.scss';
/**
 * Types
 */
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../../../types';
import type React from 'react';

// Global scripts array to be run in the Sandbox context.
const sandboxScripts = [];

// Populate scripts array with videopresAjaxURLBlob blobal var.
if ( window.videopressAjax ) {
	const videopresAjaxURLBlob = new Blob(
		[
			`var videopressAjax = ${ JSON.stringify( {
				...window.videopressAjax,
				context: 'sandbox',
			} ) };`,
		],
		{
			type: 'text/javascript',
		}
	);

	// Token bridge script
	sandboxScripts.push(
		URL.createObjectURL( videopresAjaxURLBlob ),
		window.videopressAjax.bridgeUrl
	);
}

// Player bridge script
if ( window?.videoPressEditorState?.playerBridgeUrl ) {
	sandboxScripts.push( window.videoPressEditorState.playerBridgeUrl );
}

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export function PosterDropdown( {
	clientId,
	attributes,
	setAttributes,
}: VideoControlProps ): React.ReactElement {
	const videoPosterDescription = `video-block__poster-image-description-${ clientId }`;

	const { poster } = attributes;
	const onSelectPoster = ( image: AdminAjaxQueryAttachmentsResponseItemProps ) => {
		setAttributes( { poster: image.url } );
	};

	const selectPosterLabel = __( 'Select Poster Image', 'jetpack-videopress-pkg' );
	const replacePosterLabel = __( 'Replace Poster Image', 'jetpack-videopress-pkg' );

	const buttonRef = useRef< HTMLButtonElement >( null );
	const videoRatio = Number( attributes?.videoRatio ) / 100 || 9 / 16;

	const [ posterPlaceholderHeight, setPosterPlaceholderHeight ] = useState( 140 );

	useEffect( () => {
		if ( ! poster || ! buttonRef?.current ) {
			return;
		}

		const { current: buttonElement } = buttonRef;
		const buttonWidth = buttonElement?.offsetWidth;
		if ( ! buttonWidth ) {
			return;
		}

		setPosterPlaceholderHeight( buttonWidth * videoRatio );
	}, [ poster, buttonRef, videoRatio ] );

	return (
		<Dropdown
			contentClassName="poster-panel__dropdown"
			placement="top left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					ref={ buttonRef }
					style={ {
						backgroundImage: poster ? `url(${ poster })` : undefined,
						height: posterPlaceholderHeight,
					} }
					className={ `poster-panel__button ${ poster ? 'has-poster' : '' }` }
					variant="secondary"
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					<span>{ ! poster ? selectPosterLabel : replacePosterLabel }</span>
				</Button>
			) }
			renderContent={ ( { onClose } ) => {
				return (
					<NavigableMenu className="block-editor-media-replace-flow__media-upload-menu">
						<MediaUploadCheck>
							<MediaUpload
								title={ __( 'Select Poster Image', 'jetpack-videopress-pkg' ) }
								onSelect={ ( image: AdminAjaxQueryAttachmentsResponseItemProps ) => {
									onSelectPoster( image );
									onClose();
								} }
								allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
								render={ ( { open } ) => (
									<MenuItem
										icon={ imageIcon }
										onClick={ open }
										aria-describedby={ videoPosterDescription }
									>
										{ __( 'Open Media Library', 'jetpack-videopress-pkg' ) }
										<p id={ videoPosterDescription } hidden>
											{ poster
												? sprintf(
														/* translators: Placeholder is an image URL. */
														__( 'The current poster image url is %s', 'jetpack-videopress-pkg' ),
														poster
												  )
												: __(
														'There is no poster image currently selected',
														'jetpack-videopress-pkg'
												  ) }
										</p>
									</MenuItem>
								) }
							/>
						</MediaUploadCheck>
					</NavigableMenu>
				);
			} }
		/>
	);
}

const getIframeWindowFromRef = ( iFrameRef ): Window | null => {
	return iFrameRef?.current?.querySelector( '.components-sandbox' )?.contentWindow;
};

type PosterFramePickerProps = {
	guid: VideoGUID;
};

/**
 * React component to pick a frame from the VideoPress video
 *
 * @param {PosterFramePickerProps} props - Component properties
 * @returns { React.ReactElement}          React component
 */
function VideoFramePicker( { guid }: PosterFramePickerProps ): React.ReactElement {
	const [ timestamp, setTimestamp ] = useState( 0 );
	const [ duration, setDuration ] = useState( 0 );
	const playerWrapperRef = useRef< HTMLDivElement >( null );

	const url = getVideoPressUrl( guid, {
		autoplay: true, // Hack 1/2: Set autoplay true to be able to control the video.
		controls: false,
		loop: false,
		muted: true,
	} );

	const { preview = { html: null }, isRequestingEmbedPreview } = usePreview( url );
	const { html } = preview;

	/**
	 * Handler function to deal with the communication
	 * between the iframe, which contains the video,
	 * and the parent window.
	 *
	 * @param {MessageEvent} event - Message event
	 */
	function listenEventsHandler( event: MessageEvent ) {
		const { data: eventData = {}, source } = event;
		const { event: eventName } = event?.data || {};

		// Set the video duration for the TimestampControl component.
		if ( eventName === 'videopress_durationchange' ) {
			if ( eventData?.durationMs ) {
				setDuration( eventData.durationMs );
			}
		}

		/*
		 * Hack 2/2: Stop the video once it's loaded.
		 * More about Permission Policy:
		 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
		 */
		if ( eventName === 'videopress_loading_state' && eventData.state === 'loaded' ) {
			setTimeout( () => {
				source.postMessage(
					{ event: 'videopress_action_set_currenttime', currentTime: 0.1 },
					{ targetOrigin: '*' }
				);
				source.postMessage( { event: 'videopress_action_pause' }, { targetOrigin: '*' } );
			}, 100 );
		}
	}

	// Listen player events.
	useEffect( () => {
		if ( ! html ) {
			return;
		}

		const sandboxIFrameWindow = getIframeWindowFromRef( playerWrapperRef );
		if ( ! sandboxIFrameWindow ) {
			return;
		}

		sandboxIFrameWindow.addEventListener( 'message', listenEventsHandler );

		return () => {
			// Remove the listener when the component is unmounted.
			sandboxIFrameWindow.removeEventListener( 'message', listenEventsHandler );
		};
	}, [ playerWrapperRef, isRequestingEmbedPreview, html ] );

	if ( isRequestingEmbedPreview ) {
		return <div>HOLA!</div>;
	}

	return (
		<div className="poster-panel__frame-picker">
			{ ! isRequestingEmbedPreview && (
				<div ref={ playerWrapperRef } className="poster-panel__frame-picker__sandbox">
					<SandBox html={ html } scripts={ sandboxScripts } />
				</div>
			) }

			<TimestampControl
				max={ duration }
				value={ timestamp }
				wait={ 250 }
				onChange={ setTimestamp }
				onDebounceChange={ iframeTimePosition => {
					const sandboxIFrameWindow = getIframeWindowFromRef( playerWrapperRef );
					sandboxIFrameWindow?.postMessage( {
						event: 'videopress_action_set_currenttime',
						currentTime: iframeTimePosition / 1000,
					} );
				} }
			/>
		</div>
	);
}

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export default function PosterPanel( {
	attributes,
	setAttributes,
}: PosterPanelProps ): React.ReactElement {
	const { poster } = attributes;
	const [ pickFromFrame, setPickFromFrame ] = useState( false );
	const onRemovePoster = () => {
		setAttributes( { poster: '' } );
	};

	return (
		<PanelBody title={ __( 'Poster', 'jetpack-videopress-pkg' ) } className="poster-panel">
			<ToggleControl
				label={ __( 'Pick from video frame', 'jetpack-videopress-pkg' ) }
				checked={ pickFromFrame }
				onChange={ setPickFromFrame }
			/>

			<div
				className={ classnames( 'poster-panel__frame-wrapper', { 'is-active': pickFromFrame } ) }
			>
				<VideoFramePicker guid={ attributes?.guid } />
			</div>

			<div
				className={ classnames( 'poster-panel__image-wrapper', { 'is-active': ! pickFromFrame } ) }
			>
				<PosterDropdown attributes={ attributes } setAttributes={ setAttributes } />
				<VideoPosterCard poster={ poster } className="poster-panel-card" />

				{ poster && (
					<MenuItem onClick={ onRemovePoster } icon={ linkOff } isDestructive variant="tertiary">
						{ __( 'Remove and use default', 'jetpack-videopress-pkg' ) }
					</MenuItem>
				) }
			</div>
		</PanelBody>
	);
}
