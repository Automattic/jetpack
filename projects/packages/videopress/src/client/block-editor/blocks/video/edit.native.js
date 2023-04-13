/**
 * WordPress dependencies
 */
import {
	BlockControls,
	BlockCaption,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { PanelBody, BottomSheet } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * Internal dependencies
 */
import getMediaToken from '../../../lib/get-media-token/index.native';
import { buildVideoPressURL, getVideoPressUrl } from '../../../lib/url';
import { usePreview } from '../../hooks/use-preview';
import { useSyncMedia } from '../../hooks/use-sync-media';
import addTokenIntoIframeSource from '../../utils/add-token-iframe-source';
import isLocalFile from '../../utils/is-local-file';
import ColorPanel from './components/color-panel';
import DetailsPanel from './components/details-panel';
import PlaybackPanel from './components/playback-panel';
import Player from './components/player';
import PrivacyAndRatingPanel from './components/privacy-and-rating-panel';
import ReplaceControl from './components/replace-control';
import VideoPressUploader from './components/videopress-uploader';
import style from './style.scss';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props - Component props.
 * @param {object} props.attributes - Block attributes.
 * @param {object} props.clientId - Block client Id.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected - Whether block is selected.
 * @param {Function} props.onFocus - Callback to notify when block should gain focus.
 * @param {Function} props.insertBlocksAfter - Function to insert a new block after the current block.
 * @returns {import('react').ReactNode} - React component.
 */
export default function VideoPressEdit( {
	attributes,
	clientId,
	setAttributes,
	isSelected,
	onFocus,
	insertBlocksAfter,
} ) {
	const {
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
	const [ isReplacingFile, setIsReplacingFile ] = useState( {
		isReplacing: false,
		prevAttrs: {},
	} );
	const [ token, setToken ] = useState();

	// Fetch token for a VideoPress GUID
	useEffect( () => {
		if ( guid ) {
			getMediaToken( 'playback', { guid } ).then( tokenData => {
				setToken( tokenData.token );
			} );
		}
	}, [ guid ] );

	const [ showReplaceControl, setShowReplaceControl ] = useState( true );

	const wasBlockJustInserted = useSelect(
		select => select( blockEditorStore ).wasBlockJustInserted( clientId, 'inserter_menu' ),
		[ clientId ]
	);
	const { replaceBlock } = useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay: false, // Note: Autoplay is disabled to prevent the video from playing fullscreen when loading the editor.
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
	const previewHTML = addTokenIntoIframeSource( preview?.html, token );

	// Display upload progress in case the editor is closed and re-opened
	// while the upload is in progress.
	useEffect( () => {
		const { id, src } = attributes;
		const isUploadInProgress = !! id && ! guid && isLocalFile( src );
		if ( isUploadInProgress ) {
			setIsUploadingFile( true );
			setFileToUpload( { id, url: src } );
		}
	}, [] );

	// Handlers of `VideoPressUploader`
	const onStartUpload = useCallback(
		media => {
			setAttributes( { id: media.id, src: media.url } );
		},
		[ setAttributes ]
	);

	// TODO: This is a temporary solution for manually saving block settings.
	// This will be removed and replaced with a more robust solution before the block is shipped to users.
	// See: https://github.com/Automattic/jetpack/pull/29996
	const [ blockSettingsSaved, setBlockSettingsSaved ] = useState( false );

	const onSaveBlockSettings = () => {
		setBlockSettingsSaved( true );
		createSuccessNotice( 'Block settings saved.' );
	};

	useSyncMedia( attributes, setAttributes, blockSettingsSaved, setBlockSettingsSaved );

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
				delete newBlockAttributes.src;

				setIsReplacingFile( { isReplacing: false, prevAttrs: {} } );
				replaceBlock( clientId, createBlock( 'videopress/video', newBlockAttributes ) );
				return;
			}
			setAttributes( { id: newVideoData.id, guid: newVideoData.guid, src: undefined } );
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
			setAttributes( { guid: null } );
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
				createErrorNotice( __( 'Invalid VideoPress URL', 'jetpack-videopress-pkg' ) );
				return;
			}
			setAttributes( { guid: guidFromSource, src: srcFromSource } );
		},
		[ setAttributes ]
	);

	const accessibilityLabelCreator = useCallback( caption => {
		if ( caption ) {
			return sprintf(
				/* translators: accessibility text. %s: video caption. */
				__( 'Video caption. %s', 'jetpack-videopress-pkg' ),
				caption
			);
		}
		/* translators: accessibility text. Empty video caption. */
		return __( 'Video caption. Empty', 'jetpack-videopress-pkg' );
	}, [] );

	const onCaptionFocus = useCallback( () => {
		setShowReplaceControl( false );
	}, [ setShowReplaceControl ] );

	const onCaptionBlur = useCallback( () => {
		setShowReplaceControl( true );
	}, [ setShowReplaceControl ] );

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
				{ showReplaceControl && (
					<ReplaceControl
						onUploadFileStart={ onReplaceUploadStart }
						onSelectVideoFromLibrary={ onReplaceSelectFromLibrary }
						onSelectURL={ onReplaceSelectURL }
					/>
				) }
			</BlockControls>

			{ isSelected && (
				<InspectorControls>
					<DetailsPanel { ...{ attributes, setAttributes } } />
					<PanelBody title={ __( 'More', 'jetpack-videopress-pkg' ) }>
						<PlaybackPanel { ...{ attributes, setAttributes } } />
						<ColorPanel { ...{ attributes, setAttributes } } />
						<PrivacyAndRatingPanel { ...{ attributes, setAttributes } } />
					</PanelBody>
					<PanelBody title={ 'Temporary for Testing' }>
						<BottomSheet.Cell label={ 'Save Settings' } onPress={ onSaveBlockSettings } />
					</PanelBody>
				</InspectorControls>
			) }

			<Player
				html={ previewHTML }
				isRequestingEmbedPreview={ isRequestingEmbedPreview }
				isSelected={ isSelected }
			/>

			<BlockCaption
				clientId={ clientId }
				insertBlocksAfter={ insertBlocksAfter }
				accessibilityLabelCreator={ accessibilityLabelCreator }
				accessible
				onFocus={ onCaptionFocus }
				onBlur={ onCaptionBlur }
			/>
		</View>
	);
}
