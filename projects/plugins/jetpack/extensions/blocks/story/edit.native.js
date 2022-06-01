import {
	MediaPlaceholder,
	BlockMediaUpdateProgress,
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
} from '@wordpress/block-editor';
import { Image } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	requestMediaFilesFailedRetryDialog,
	requestMediaFilesSaveCancelDialog,
	requestMediaFilesUploadCancelDialog,
	mediaUploadSync,
	mediaSaveSync,
	mediaFilesBlockReplaceSync,
	requestMediaFilesEditorLoad,
} from '@wordpress/react-native-bridge';
import { View, TouchableWithoutFeedback } from 'react-native';
import styles from './editor.scss';
import StoryEditingButton from './story-editing-button';
import { icon } from '.';

const StoryEdit = ( { attributes, isSelected, clientId, setAttributes, onFocus } ) => {
	const { mediaFiles } = attributes;
	const hasContent = !! mediaFiles.length;

	// setup state vars
	const [ isUploadInProgress, setUploadInProgress ] = useState( false );

	const [ isSaveInProgress, setSaveInProgress ] = useState( false );

	const [ didUploadFail, setUploadFail ] = useState( false );

	const [ didSaveFail, setSaveFail ] = useState( false );

	// sync with local media store
	useEffect( mediaUploadSync, [] );

	useEffect( mediaSaveSync, [] );

	// also sync in case we need to replace this block
	useEffect( () => {
		mediaFilesBlockReplaceSync( mediaFiles, clientId );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ clientId ] );

	function onEditButtonTapped() {
		// let's open the Story Creator and load this block in there
		requestMediaFilesEditorLoad( mediaFiles, clientId );
	}

	// upload state handling methods
	function updateMediaUploadProgress( payload ) {
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! isUploadInProgress ) {
			setUploadInProgress( true );
		}
	}

	function finishMediaUploadWithSuccess( payload ) {
		// find the mediaFiles item that needs to change via its id, and apply the new URL
		const updatedMediaFiles = replaceNewIdInMediaFilesByOldId(
			payload.mediaId,
			payload.mediaServerId,
			payload.mediaUrl
		);
		setAttributes( { mediaFiles: updatedMediaFiles } );
		setUploadInProgress( false );
	}

	function finishMediaUploadWithFailure( payload ) {
		// should anything be done on media upload failure, do it here
		setUploadInProgress( false );
		setUploadFail( true );
	}

	function mediaUploadStateReset() {
		setUploadInProgress( false );
	}

	// save state handling methods
	function updateMediaSaveProgress( payload ) {
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! isSaveInProgress ) {
			setSaveInProgress( true );
		}
	}

	function replaceMediaUrlInMediaFilesById( mediaId, mediaUrl ) {
		if ( mediaId !== undefined ) {
			const newMediaFiles = mediaFiles.map( mediaFile => {
				if ( mediaFile.id === mediaId.toString() ) {
					// we need to deep copy because attributes can't be modified in-place
					return { ...mediaFile, url: mediaUrl, link: mediaUrl };
				}
				return { ...mediaFile };
			} );
			return newMediaFiles;
		}
		return mediaFiles;
	}

	function replaceNewIdInMediaFilesByOldId( oldId, mediaId, mediaUrl ) {
		if ( mediaId !== undefined ) {
			const newMediaFiles = mediaFiles.map( mediaFile => {
				if ( mediaFile.id === oldId.toString() ) {
					// we need to deep copy because attributes can't be modified in-place
					return { ...mediaFile, id: mediaId, url: mediaUrl, link: mediaUrl };
				}
				return { ...mediaFile };
			} );
			return newMediaFiles;
		}
		return mediaFiles;
	}

	function finishMediaSaveWithSuccess( payload ) {
		// find the mediaFiles item that needs to change via its id, and apply the new URL
		const updatedMediaFiles = replaceMediaUrlInMediaFilesById( payload.mediaId, payload.mediaUrl );
		setAttributes( { mediaFiles: updatedMediaFiles } );
		setSaveInProgress( false );
	}

	function finishMediaSaveWithFailure( payload ) {
		// should anything be done on save failure on one single item in the media collection, do it here
		setSaveInProgress( false );
	}

	function mediaSaveStateReset() {
		setSaveInProgress( false );
	}

	function onStorySaveResult( payload ) {
		// when story result ends up in failure, the failed overlay will be set in BlockMediaUpdateProgress
		setSaveInProgress( false );
		setSaveFail( ! payload.success );
	}

	function onMediaIdChanged( payload ) {
		const updatedMediaFiles = replaceNewIdInMediaFilesByOldId(
			payload.mediaId,
			payload.newId,
			payload.mediaUrl
		);
		setAttributes( { mediaFiles: updatedMediaFiles } );
		setSaveInProgress( false );
	}

	function onStoryPressed() {
		if ( isUploadInProgress ) {
			// issue cancellation for all media files involved
			requestMediaFilesUploadCancelDialog( mediaFiles );
		} else if ( isSaveInProgress ) {
			requestMediaFilesSaveCancelDialog( mediaFiles );
		} else if ( didUploadFail ) {
			requestMediaFilesFailedRetryDialog( mediaFiles );
		} else {
			// open the editor
			onEditButtonTapped();
		}
	}

	const mediaPlaceholder = (
		// TODO this we are wrapping in a pointerEvents=none because we don't want to
		// trigger the ADD MEDIA bottom sheet just yet, but only give the placedholder the right appearance.
		<View pointerEvents="none" style={ styles[ 'content-placeholder' ] }>
			<MediaPlaceholder
				icon={ icon }
				labels={ {
					title: __( 'Story', 'jetpack' ),
					instructions: __( 'ADD MEDIA', 'jetpack' ),
				} }
				allowedTypes={ [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ] }
				onFocus={ onFocus }
			/>
		</View>
	);

	return (
		<TouchableWithoutFeedback
			accessible={ ! isSelected }
			onPress={ onStoryPressed }
			disabled={ ! isSelected }
		>
			<View style={ styles[ 'content-placeholder' ] }>
				{ ! hasContent && mediaPlaceholder }
				{ hasContent && (
					<View style={ styles[ 'wp-story-container' ] }>
						{ ! isUploadInProgress && ! isSaveInProgress && isSelected && (
							<StoryEditingButton onEditButtonTapped={ onEditButtonTapped } />
						) }
						<BlockMediaUpdateProgress
							coverUrl={ mediaFiles[ 0 ].url } // just select the first one // TODO see how to handle video
							mediaFiles={ mediaFiles }
							onUpdateMediaUploadProgress={ updateMediaUploadProgress }
							onFinishMediaUploadWithSuccess={ finishMediaUploadWithSuccess }
							onFinishMediaUploadWithFailure={ finishMediaUploadWithFailure }
							onMediaUploadStateReset={ mediaUploadStateReset }
							onUpdateMediaSaveProgress={ updateMediaSaveProgress }
							onFinishMediaSaveWithSuccess={ finishMediaSaveWithSuccess }
							onFinishMediaSaveWithFailure={ finishMediaSaveWithFailure }
							onMediaSaveStateReset={ mediaSaveStateReset }
							onFinalSaveResult={ onStorySaveResult }
							onMediaIdChanged={ onMediaIdChanged }
							renderContent={ ( {
								isUploadProgressing,
								isUploadFailed,
								isSaveProgressing,
								isSaveFailed,
								retryMessage,
							} ) => {
								return (
									<Image
										isUploadFailed={ isUploadFailed || isSaveFailed }
										isUploadInProgress={ isUploadProgressing || isSaveProgressing }
										retryMessage={ retryMessage }
										url={ mediaFiles[ 0 ].url } // just select the first one // TODO see how to handle video
										style={ styles[ 'wp-story-image' ] }
									/>
								);
							} }
						/>
					</View>
				) }
			</View>
		</TouchableWithoutFeedback>
	);
};

export default StoryEdit;
