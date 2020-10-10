/**
 * External dependencies
 */
import React from 'react';
import { Text, View } from 'react-native';
/**
 * WordPress dependencies
 */
import { Image } from '@wordpress/components';
import { BlockMediaUpdateProgress } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { getProtocol } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import {
	// TODO implement the similar / following bridge signals
	// requestImageFailedRetryDialog,
	// requestImageUploadCancelDialog,
	// requestImageFullscreenPreview,
	mediaUploadSync,
	mediaSaveSync,
	// requestStoryCreatorLoad,
	sendActionButtonPressedAction,
	actionButtons,
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

		this.onMediaModelCreated = this.onMediaModelCreated.bind( this );

		this.state = {
			isUploadInProgress: false,
			isSaveInProgress: false,
			didUploadFail: false,
			didSaveFail: false,
		};
	}

	componentDidMount() {
		const { attributes } = this.props;
		if ( attributes.mediaFiles !== undefined ) {
			for ( let i = 0; i < attributes.mediaFiles.length; i++ ) {
				const protocolForUrl = getProtocol( attributes.mediaFiles[ i ].url );
				if (
					( attributes.mediaFiles[ i ].id && protocolForUrl !== 'http:' ) ||
					protocolForUrl !== 'https:'
				) {
					mediaUploadSync();
					mediaSaveSync();
					return;
				}
			}
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
					if (
						( attributes.mediaFiles[ i ].id && protocolForUrl !== 'http:' ) ||
						protocolForUrl !== 'https:'
					) {
						doAction( 'blocks.onRemoveBlockCheckUpload', attributes.mediaFiles[ i ].id );
					}
				}
			}
		}
	}

	onEditButtonTapped() {
		const { attributes, clientId } = this.props;

		// TODO review states and dialog mechanism

		// if ( this.state.isUploadInProgress ) {
		// 	requestImageUploadCancelDialog( attributes.id );
		// } else if (
		// 	attributes.id &&
		// 	getProtocol( attributes.src ) === 'file:'
		// ) {
		// 	requestImageFailedRetryDialog( attributes.id );
		// }

		// this.setState( {
		// 	isCaptionSelected: false,
		// } );

		// TODO decide which course of action to take depending on current state for this Story block
		// if ( isUploadInProgress ) {
		// 	requestImageUploadCancelDialog( id );
		// } else if ( shouldShowFailure ) {
		// 	requestImageFailedRetryDialog( id );
		// } else if ( isImage && url ) {
		// 	requestImageFullscreenPreview( url );
		// }
		// requestStoryCreatorLoad( id );
		// let's open the Story Creator and load this block in there
		// requestStoryCreatorLoad( attributes.mediaFiles, clientId );
		sendActionButtonPressedAction(
			actionButtons.mediaFilesEditorActionButton,
			clientId,
			attributes.mediaFiles
		);
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
		// setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId } );
		// find the mediaFiles item that needs to change via its id, and apply the new URL
		// var updatedMediaFiles = this.replaceMediaUrlInMediaFilesById( payload.mediaId, payload.mediaUrl);
		const updatedMediaFiles = this.replaceNewIdInMediaFilesByOldId(
			payload.mediaId,
			payload.mediaServerId,
			payload.mediaUrl
		);
		setAttributes( { mediaFiles: updatedMediaFiles } );
		this.setState( { isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;
		// TODO change this
		// setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;
		// TODO change this
		// setAttributes( { id: null, src: null } );
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
		if ( mediaId !== undefined && attributes.mediaFiles !== undefined ) {
			for ( let i = 0; i < attributes.mediaFiles.length; i++ ) {
				if ( attributes.mediaFiles[ i ].id === mediaId.toString() ) {
					attributes.mediaFiles[ i ].url = mediaUrl;
					attributes.mediaFiles[ i ].link = mediaUrl;
				}
			}
		}
		return attributes.mediaFiles;
	}

	replaceNewIdInMediaFilesByOldId( oldId, mediaId, mediaUrl ) {
		const { attributes } = this.props;
		if ( mediaId !== undefined && attributes.mediaFiles !== undefined ) {
			for ( let i = 0; i < attributes.mediaFiles.length; i++ ) {
				if ( attributes.mediaFiles[ i ].id === oldId.toString() ) {
					attributes.mediaFiles[ i ].id = mediaId;
					attributes.mediaFiles[ i ].url = mediaUrl;
					attributes.mediaFiles[ i ].link = mediaUrl;
				}
			}
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
		const { setAttributes } = this.props;
		// TODO change this
		// setAttributes( { id: payload.mediaId } );
		this.setState( { isSaveInProgress: false } );
	}

	mediaSaveStateReset() {
		const { setAttributes } = this.props;
		// TODO change this
		// setAttributes( { id: null, src: null } );
		this.setState( { isSaveInProgress: false } );
	}

	onStorySaveResult() {
		const { setAttributes } = this.props;
		// TODO here set success or fail overlay
		// setAttributes( { id: null, src: null } );
		this.setState( { isSaveInProgress: false } );
	}

	onMediaModelCreated( payload ) {
		const { setAttributes } = this.props;
		const updatedMediaFiles = this.replaceNewIdInMediaFilesByOldId(
			payload.mediaId,
			payload.newId,
			payload.mediaUrl
		);
		setAttributes( { mediaFiles: updatedMediaFiles } );
		this.setState( { isSaveInProgress: false } );
	}

	render() {
		const { attributes, isSelected } = this.props;
		const { mediaFiles } = attributes;
		const hasContent = !! mediaFiles.length;
		const { isUploadInProgress, isSaveInProgress, didUploadFail, didSaveFail } = this.state;

		return (
			<View style={ styles[ 'wp-story-container' ] }>
				{ ! hasContent && (
					<Text style={ styles[ 'wp-story-wrapper' ] }>Empty Story placeholder here</Text>
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
							onMediaModelCreated={ this.onMediaModelCreated }
							renderContent={ ( {
								isUploadInProgress,
								isUploadFailed,
								isSaveInProgress,
								isSaveFailed,
								retryMessage,
							} ) => {
								return (
									<Image
										url={ mediaFiles[ 0 ].url } // just select the first one // TODO see how to handle video
										style={ styles[ 'wp-story-image' ] }
									/>
								);
							} }
						/>
					</View>
				) }
			</View>
		);
	}
}

export default StoryEdit;
