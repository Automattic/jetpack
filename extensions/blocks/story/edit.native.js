/**
 * External dependencies
 */
import React from 'react';
import { Text, View } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	Image,
} from '@wordpress/components';
import {
	// BlockCaption,
	// MediaPlaceholder,
	// MediaUpload,
	MediaUploadProgress,
	MEDIA_TYPE_IMAGE,
	StoryUpdateProgress,
	// BlockControls,
	// InspectorControls,
	// BlockAlignmentToolbar,
	// BlockStyles,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { getProtocol } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import {
	// TODO implement the similar / following bridge signals
	// requestImageFailedRetryDialog,
	// requestImageUploadCancelDialog,
	// requestImageFullscreenPreview,
	mediaUploadSync,
	storySaveSync,
	requestStoryCreatorLoad,
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
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind(
			this
		);
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind(
			this
		);
		this.updateMediaUploadProgress = this.updateMediaUploadProgress.bind( this );

		// save progress bindings
		this.mediaSaveStateReset = this.mediaSaveStateReset.bind( this );
		this.finishMediaSaveWithSuccess = this.finishMediaSaveWithSuccess.bind(
			this
		);
		this.finishMediaSaveWithFailure = this.finishMediaSaveWithFailure.bind(
			this
		);
		this.updateMediaSaveProgress = this.updateMediaSaveProgress.bind( this );

		this.state = {
			isUploadInProgress: false,
			isSaveInProgress: false,
			didUploadFail: false,
			didSaveFail: false,
		};
	}

	componentDidMount() {
		const { attributes } = this.props;
		if ( attributes.id && getProtocol( attributes.src ) === 'file:' ) {
			mediaUploadSync();
		}
	}

	componentWillUnmount() {
		// this action will only exist if the user pressed the trash button on the block holder
		if (
			hasAction( 'blocks.onRemoveBlockCheckUpload' ) &&
			(this.state.isUploadInProgress || this.state.isSaveInProgress)
		) {
			doAction(
				'blocks.onRemoveBlockCheckUpload',
				this.props.attributes.id
			);
		}
	}

	onEditButtonTapped() {
		const { attributes, clientId } = this.props;

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
		requestStoryCreatorLoad( attributes.mediaFiles, clientId );
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
		setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId } );
		this.setState( { isUploadInProgress: false } );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;
		setAttributes( { id: null, src: null } );
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

	finishMediaSaveWithSuccess( payload ) {
		const { setAttributes } = this.props;
		// TODO probably have to set the localid here? but this is a story, it's a list of media.
		setAttributes( { src: payload.mediaUrl } );
		this.setState( { isSaveInProgress: false } );
	}

	finishMediaSaveWithFailure( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId } );
		this.setState( { isSaveInProgress: false } );
	}

	mediaSaveStateReset() {
		const { setAttributes } = this.props;
		setAttributes( { id: null, src: null } );
		this.setState( { isSaveInProgress: false } );
	}

	render() {
		const { setAttributes, attributes, isSelected } = this.props;
		const { mediaFiles } = attributes;
		const hasContent = !! mediaFiles.length;
		const {
			isUploadInProgress,
			isSaveInProgress,
			didUploadFail,
			didSaveFail,
		} = this.state;
	
		return (
			<View style={ styles['wp-story-container'] }>
				{!hasContent && 
					<Text style={ styles['wp-story-wrapper'] }>
							Empty Story placeholder here
					</Text>
				}	
				{ hasContent && 
					<View style={ { flex: 1 } }>
						{ !isUploadInProgress && !isSaveInProgress &&
							isSelected && (
							<StoryEditingButton
								onEditButtonTapped={ this.onEditButtonTapped }
							/>
						) }
						<StoryUpdateProgress
							coverUrl={ mediaFiles[0].url } // just select the first one // TODO see how to handle video
							// mediaId={ id }
							mediaFiles = { mediaFiles}
							onUpdateMediaUploadProgress={ this.updateMediaUploadProgress }
							onFinishMediaUploadWithSuccess={
								this.finishMediaUploadWithSuccess
							}
							onFinishMediaUploadWithFailure={
								this.finishMediaUploadWithFailure
							}
							onMediaUploadStateReset={
								this.mediaUploadStateReset
							}
							onUpdateMediaSaveProgress={ this.updateMediaSaveProgress }
							onFinishMediaSaveWithSuccess={
								this.finishMediaSaveWithSuccess
							}
							onFinishMediaUploadWithFailure={
								this.finishMediaSaveWithFailure
							}
							onMediaSaveStateReset={
								this.mediaSaveStateReset
							}
							renderContent={ ( {
								isUploadInProgress,
								isUploadFailed,
								isSaveInProgress,
								isSaveFailed,
								retryMessage,
							} ) => {
								return (
									<Image
											url={ mediaFiles[0].url } // just select the first one // TODO see how to handle video
											style={ styles['wp-story-image'] }
									/>
								);
							} }
						/>
	
					</View>
				}
			</View>
		);
	}
}

export default StoryEdit;
