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
	// TODO implement the similar / following bridge signals
	// requestImageFailedRetryDialog,
	// requestImageUploadCancelDialog,
	// requestImageFullscreenPreview,
	// mediaUploadSync,
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
				</View>
			}
		</View>
	);
};

export default StoryEdit;
