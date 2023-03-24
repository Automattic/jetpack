/**
 * WordPress dependencies
 */
import {
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';
/**
 * Internal dependencies
 */
import { buildVideoPressURL, getVideoPressUrl } from '../../../lib/url';
import { usePreview } from '../../hooks/use-preview';
import ColorPanel from './components/color-panel';
import DetailsPanel from './components/details-panel';
import PlaybackPanel from './components/playback-panel';
import Player from './components/player';
import ReplaceControl from './components/replace-control/index.native';
import VideoPressUploader from './components/videopress-uploader/index.native';
import style from './style.scss';
import type { VideoBlockAttributes } from './types';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {object} props.clientId        - Block client Id.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected	 - Whether block is selected.
 * @param {Function} props.onFocus       - Callback to notify when block should gain focus.
 * @returns {React.ReactNode}            - React component.
 */
export default function VideoPressEdit( {
	attributes,
	clientId,
	setAttributes,
	isSelected,
	onFocus,
} ): React.ReactNode {
	const {
		autoplay,
		controls,
		guid,
		loop,
		muted,
		playsinline,
		poster,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
	} = attributes;

	const [ isUploadingFile, setIsUploadingFile ] = useState( ! guid );
	const [ fileToUpload, setFileToUpload ] = useState( null );
	const [ isReplacingFile, setIsReplacingFile ] = useState< {
		isReplacing: boolean;
		prevAttrs: VideoBlockAttributes;
	} >( {
		isReplacing: false,
		prevAttrs: {},
	} );

	const wasBlockJustInserted = useSelect(
		select => select( blockEditorStore ).wasBlockJustInserted( clientId, 'inserter_menu' ),
		[ clientId ]
	);
	const { replaceBlock } = useDispatch( blockEditorStore );

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay,
		controls,
		loop,
		muted,
		playsinline,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
		poster,
	} );

	const { preview, isRequestingEmbedPreview } = usePreview( videoPressUrl );

	// Handlers of `VideoPressUploader`
	const onStartUpload = useCallback(
		media => {
			setAttributes( { id: media.id } );
		},
		[ setAttributes ]
	);

	const handleDoneUpload = useCallback(
		newVideoData => {
			setIsUploadingFile( false );
			if ( isReplacingFile.isReplacing ) {
				const newBlockAttributes = {
					...attributes,
					...newVideoData,
				};

				// Delete attributes that are not needed.
				delete newBlockAttributes.poster;

				setIsReplacingFile( { isReplacing: false, prevAttrs: {} } );
				replaceBlock( clientId, createBlock( 'videopress/video', newBlockAttributes ) );
				return;
			}
			setAttributes( { id: newVideoData.id, guid: newVideoData.guid } );
		},
		[ setIsUploadingFile, setAttributes ]
	);

	const cancelReplacingVideoFile = useCallback( () => {
		setAttributes( isReplacingFile.prevAttrs );
		setIsReplacingFile( { isReplacing: false, prevAttrs: {} } );
		setIsUploadingFile( false );
	}, [ isReplacingFile, setAttributes, setIsReplacingFile, setIsUploadingFile ] );

	// Handlers of `ReplaceControl`
	const onReplaceUploadStart = useCallback(
		media => {
			setIsReplacingFile( { isReplacing: true, prevAttrs: attributes } );
			setIsUploadingFile( true );
			setFileToUpload( media );
		},
		[ setIsReplacingFile, setIsUploadingFile, setFileToUpload ]
	);

	const onReplaceSelectFromLibrary = useCallback(
		media => {
			const { id, title, description, metadata } = media;

			const videoPressGuid = metadata?.videopressGUID;
			if ( ! videoPressGuid ) {
				return;
			}
			setAttributes( {
				guid: videoPressGuid,
				id,
				title,
				description,
			} );
		},
		[ setAttributes ]
	);

	const onReplaceSelectURL = useCallback(
		videoSource => {
			const { guid: guidFromSource, url: srcFromSource } = buildVideoPressURL( videoSource );
			if ( ! guidFromSource ) {
				return;
			}
			setAttributes( { guid: guidFromSource, src: srcFromSource } );
		},
		[ setAttributes ]
	);

	if ( isUploadingFile ) {
		return (
			<VideoPressUploader
				autoOpenMediaUpload={ isSelected && wasBlockJustInserted }
				fileToUpload={ fileToUpload }
				handleDoneUpload={ handleDoneUpload }
				isInteractionDisabled={ ! isSelected }
				isReplacing={ isReplacingFile?.isReplacing }
				onFocus={ onFocus }
				onReplaceCancel={ cancelReplacingVideoFile }
				onStartUpload={ onStartUpload }
			/>
		);
	}

	return (
		<View style={ style[ 'wp-block-jetpack-videopress__container' ] }>
			<BlockControls>
				<ReplaceControl
					onUploadFileStart={ onReplaceUploadStart }
					onSelectVideoFromLibrary={ onReplaceSelectFromLibrary }
					onSelectURL={ onReplaceSelectURL }
				/>
			</BlockControls>

			{ isSelected && (
				<InspectorControls>
					<DetailsPanel { ...{ attributes, setAttributes } } />
					<PanelBody title={ __( 'More', 'jetpack-videopress-pkg' ) }>
						<PlaybackPanel { ...{ attributes, setAttributes } } />
						<ColorPanel { ...{ attributes, setAttributes } } />
					</PanelBody>
				</InspectorControls>
			) }

			<Player
				html={ preview.html }
				isRequestingEmbedPreview={ isRequestingEmbedPreview }
				isSelected={ isSelected }
			/>
		</View>
	);
}
