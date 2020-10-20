/**
 * External dependencies
 */
import React from 'react';
import { Text, View, TouchableWithoutFeedback } from 'react-native';
/**
 * WordPress dependencies
 */
import { Image } from '@wordpress/components';
import { BlockMediaUpdateProgress } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { getProtocol } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import {
	requestMediaFilesFailedRetryDialog,
	requestMediaFilesSaveCancelDialog,
	requestMediaFilesUploadCancelDialog,
	mediaUploadSync,
	mediaSaveSync,
	requestMediaFilesEditorLoad,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './editor.scss';
import StoryEditingButton from './story-editing-button';

class StoryEdit extends React.Component {
	constructor( props ) {
		super( props );

		this.onEditButtonTapped = this.onEditButtonTapped.bind( this );

		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.updateMediaUploadProgress = this.updateMediaUploadProgress.bind( this );

		// save progress bindings
		this.mediaSaveStateReset = this.mediaSaveStateReset.bind( this );
		this.finishMediaSaveWithSuccess = this.finishMediaSaveWithSuccess.bind( this );
		this.finishMediaSaveWithFailure = this.finishMediaSaveWithFailure.bind( this );
		this.updateMediaSaveProgress = this.updateMediaSaveProgress.bind( this );

		this.onStorySaveResult = this.onStorySaveResult.bind( this );

		this.onMediaIdChanged = this.onMediaIdChanged.bind( this );

		this.onStoryPressed = this.onStoryPressed.bind( this );

		this.state = {
			isUploadInProgress: false,
			isSaveInProgress: false,
			didUploadFail: false,
			didSaveFail: false,
		};
	}

	isUrlRemote( protocolForUrl ) {
		return protocolForUrl === 'http:' || protocolForUrl === 'https:';
	}

	componentDidMount() {
		const { attributes } = this.props;
		if ( attributes.mediaFiles !== undefined ) {
			mediaUploadSync();
			mediaSaveSync();
		}
	}

	componentWillUnmount() {
		// this action will only exist if the user pressed the trash button on the block holder
		// TODO check whether blocks.onRemoveBlockCheckUpload really is being set elsewhere
		// and ditch / fix if not
		if (
			hasAction( 'blocks.onRemoveBlockCheckUpload' ) &&
			( this.state.isUploadInProgress || this.state.isSaveInProgress )
		) {
			const { attributes } = this.props;
			if ( attributes.mediaFiles !== undefined ) {
				for ( let i = 0; i < attributes.mediaFiles.length; i++ ) {
					const protocolForUrl = getProtocol( attributes.mediaFiles[ i ].url );
					if ( attributes.mediaFiles[ i ].id && ! this.isUrlRemote( protocolForUrl ) ) {
						doAction( 'blocks.onRemoveBlockCheckUpload', attributes.mediaFiles[ i ].id );
					}
				}
			}
		}
	}

	onEditButtonTapped() {
		const { attributes, clientId } = this.props;

		// let's open the Story Creator and load this block in there
		requestMediaFilesEditorLoad( attributes.mediaFiles, clientId );
	}

	// upload state handling methods
	updateMediaUploadProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;
		// find the mediaFiles item that needs to change via its id, and apply the new URL
		const updatedMediaFiles = this.replaceNewIdInMediaFilesByOldId(
			payload.mediaId,
			payload.mediaServerId,
			payload.mediaUrl
		);
		setAttributes( { mediaFiles: updatedMediaFiles } );
		this.setState( { isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		// should anything be done on media upload failure, do it here
		this.setState( { isUploadInProgress: false, didUploadFail: true } );
	}

	mediaUploadStateReset() {
		this.setState( { isUploadInProgress: false } );
	}

	// save state handling methods
	updateMediaSaveProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! this.state.isSaveInProgress ) {
			this.setState( { isSaveInProgress: true } );
		}
	}

	replaceMediaUrlInMediaFilesById( mediaId, mediaUrl ) {
		const { attributes } = this.props;
		if ( mediaId !== undefined ) {
			const newMediaFiles = attributes.mediaFiles.map( mediaFile => {
				if ( mediaFile.id === mediaId.toString() ) {
					// we need to deep copy because attributes can't be modified in-place
					return { ...mediaFile, url: mediaUrl, link: mediaUrl };
				}
				return { ...mediaFile };
			} );
			return newMediaFiles;
		}
		return attributes.mediaFiles;
	}

	replaceNewIdInMediaFilesByOldId( oldId, mediaId, mediaUrl ) {
		const { attributes } = this.props;
		if ( mediaId !== undefined ) {
			const newMediaFiles = attributes.mediaFiles.map( mediaFile => {
				if ( mediaFile.id === oldId.toString() ) {
					// we need to deep copy because attributes can't be modified in-place
					return { ...mediaFile, id: mediaId, url: mediaUrl, link: mediaUrl };
				}
				return { ...mediaFile };
			} );
			return newMediaFiles;
		}
		return attributes.mediaFiles;
	}

	finishMediaSaveWithSuccess( payload ) {
		const { setAttributes } = this.props;
		// find the mediaFiles item that needs to change via its id, and apply the new URL
		const updatedMediaFiles = this.replaceMediaUrlInMediaFilesById(
			payload.mediaId,
			payload.mediaUrl
		);
		setAttributes( { mediaFiles: updatedMediaFiles } );
		this.setState( { isSaveInProgress: false } );
	}

	finishMediaSaveWithFailure( payload ) {
		// should anything be done on save failure on one single item in the media collection, do it here
		this.setState( { isSaveInProgress: false } );
	}

	mediaSaveStateReset() {
		this.setState( { isSaveInProgress: false } );
	}

	onStorySaveResult( payload ) {
		// when story result ends up in failure, the failed overlay will be set in BlockMediaUpdateProgress
		this.setState( { isSaveInProgress: false, didSaveFail: ! payload.success } );
	}

	onMediaIdChanged( payload ) {
		const { setAttributes } = this.props;
		const updatedMediaFiles = this.replaceNewIdInMediaFilesByOldId(
			payload.mediaId,
			payload.newId,
			payload.mediaUrl
		);
		setAttributes( { mediaFiles: updatedMediaFiles } );
		this.setState( { isSaveInProgress: false } );
	}

	onStoryPressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			// issue cancellation for all media files involved
			requestMediaFilesUploadCancelDialog( attributes.mediaFiles );
		} else if ( this.state.isSaveInProgress ) {
			requestMediaFilesSaveCancelDialog( attributes.mediaFiles );
		} else if ( this.state.didUploadFail ) {
			requestMediaFilesFailedRetryDialog( attributes.mediaFiles );
		} else {
			// open the editor
			this.onEditButtonTapped();
		}
	}

	render() {
		const { attributes, isSelected } = this.props;
		const { mediaFiles } = attributes;
		const hasContent = !! mediaFiles.length;
		const { isUploadInProgress, isSaveInProgress, didUploadFail, didSaveFail } = this.state;

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				onPress={ this.onStoryPressed }
				disabled={ ! isSelected }
			>
				<View style={ styles[ 'wp-story-container' ] }>
					{ ! hasContent && (
						<Text style={ styles[ 'wp-story-wrapper' ] }>
							This Story is empty. Tap to add media.
						</Text>
					) }
					{ hasContent && (
						<View style={ { flex: 1 } }>
							{ ! isUploadInProgress && ! isSaveInProgress && isSelected && (
								<StoryEditingButton onEditButtonTapped={ this.onEditButtonTapped } />
							) }
							<BlockMediaUpdateProgress
								coverUrl={ mediaFiles[ 0 ].url } // just select the first one // TODO see how to handle video
								mediaFiles={ mediaFiles }
								onUpdateMediaUploadProgress={ this.updateMediaUploadProgress }
								onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
								onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
								onMediaUploadStateReset={ this.mediaUploadStateReset }
								onUpdateMediaSaveProgress={ this.updateMediaSaveProgress }
								onFinishMediaSaveWithSuccess={ this.finishMediaSaveWithSuccess }
								onFinishMediaSaveWithFailure={ this.finishMediaSaveWithFailure }
								onMediaSaveStateReset={ this.mediaSaveStateReset }
								onFinalSaveResult={ this.onStorySaveResult }
								onMediaIdChanged={ this.onMediaIdChanged }
								renderContent={ ( {
									isUploadInProgress,
									isUploadFailed,
									isSaveInProgress,
									isSaveFailed,
									retryMessage,
								} ) => {
									return (
										<Image
											isUploadFailed={ isUploadFailed || isSaveFailed }
											isUploadInProgress={ isUploadInProgress || isSaveInProgress }
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
	}
}

export default StoryEdit;
