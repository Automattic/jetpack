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
	// TODO implement the similar / following bridge signals
	// requestImageFailedRetryDialog,
	// requestImageUploadCancelDialog,
	requestMediaFilesFailedRetryDialog,
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

		this.onMediaModelCreated = this.onMediaModelCreated.bind( this );

		this.onStoryPressed = this.onStoryPressed.bind( this );

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
		// requestMediaFilesEditorLoad( id );
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
		const newMediaFiles = this.deepCopyMediaFiles();
		if ( mediaId !== undefined && newMediaFiles !== undefined ) {
			for ( let i = 0; i < newMediaFiles.length; i++ ) {
				if ( newMediaFiles[ i ].id === mediaId.toString() ) {
					newMediaFiles[ i ].url = mediaUrl;
					newMediaFiles[ i ].link = mediaUrl;
					return newMediaFiles;
				}
			}
		}
		return newMediaFiles;
	}

	deepCopyMediaFiles() {
		const { attributes } = this.props;
		const newMediaFiles = [];
		if ( attributes.mediaFiles !== undefined ) {
			for ( let i = 0; i < attributes.mediaFiles.length; i++ ) {
				// copy to new object
				newMediaFiles[ i ] = {
					id: attributes.mediaFiles[ i ].id,
					url: attributes.mediaFiles[ i ].url,
					link: attributes.mediaFiles[ i ].link,
					alt: attributes.mediaFiles[ i ].alt,
					caption: attributes.mediaFiles[ i ].caption,
					mime: attributes.mediaFiles[ i ].mime,
					type: attributes.mediaFiles[ i ].type,
				};
			}
		}
		return newMediaFiles;
	}

	replaceNewIdInMediaFilesByOldId( oldId, mediaId, mediaUrl ) {
		const { attributes } = this.props;
		const newMediaFiles = this.deepCopyMediaFiles();
		if ( mediaId !== undefined && newMediaFiles !== undefined ) {
			for ( let i = 0; i < newMediaFiles.length; i++ ) {
				if ( newMediaFiles[ i ].id === oldId.toString() ) {
					newMediaFiles[ i ].id = mediaId;
					newMediaFiles[ i ].url = mediaUrl;
					newMediaFiles[ i ].link = mediaUrl;
					return newMediaFiles;
				}
			}
		}
		return newMediaFiles;
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

	onStoryPressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			// TODO requestImageUploadCancelDialog, and issue cancellation for all media files involved
			// requestImageUploadCancelDialog( attributes.id );
			requestMediaFilesUploadCancelDialog( attributes.mediaFiles );
		} else if ( this.state.isSaveInProgress ) {
			// TODO: show some toast that the Story is being saved and can't be edited
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
