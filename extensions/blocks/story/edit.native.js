/**
 * External dependencies
 */
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

const StoryEdit = ({
		attributes,
		isSelected,
		clientId,
		editButton = true,
}) => {
	const { mediaFiles } = attributes;
	const hasContent = !! mediaFiles.length;

	const onEditButtonTapped = () => {
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
		requestStoryCreatorLoad( mediaFiles, clientId );
	};

	return (
		<View style={ styles['wp-story-container'] }>
			{!hasContent && 
				<Text style={ styles['wp-story-wrapper'] }>
						Empty Story placeholder here
				</Text>
			}	
			{ hasContent && 
				<View style={ styles['wp-story-wrapper'] }>
					{ editButton &&
						isSelected && (
						<StoryEditingButton
							onEditButtonTapped={ onEditButtonTapped }
						/>
					) }
					<Image
						url={ mediaFiles[0].url } // just select the first one // TODO see how to handle video
						style={ styles['wp-story-image'] }
					/>
					<StoryUpdateProgress
						coverUrl={ mediaFiles[0].url } // just select the first one // TODO see how to handle video
						// mediaId={ id }
						mediaFiles = { mediaFiles}
						onUpdateMediaProgress={ this.updateMediaProgress }
						onFinishMediaUploadWithSuccess={
							this.finishMediaUploadWithSuccess
						}
						onFinishMediaUploadWithFailure={
							this.finishMediaUploadWithFailure
						}
						onMediaUploadStateReset={
							this.mediaUploadStateReset
						}
						renderContent={ ( {
							isUploadInProgress,
							isUploadFailed,
							retryMessage,
						} ) => {
							return (
								<Image
									isSelected={ isSelected }
									isUploadFailed={ isUploadFailed }
									isUploadInProgress={
										isUploadInProgress
									}
									retryMessage={ retryMessage }
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
};

export default StoryEdit;
