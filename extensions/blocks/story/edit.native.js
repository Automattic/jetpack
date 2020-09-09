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

/**
 * Internal dependencies
 */
import styles from './editor.scss';

const StoryEdit = ({
		attributes,
}) => {
	const { mediaFiles } = attributes;
	const hasContent = !! mediaFiles.length;
	return (
		<View style={ styles['wp-story-container'] }>
			{!hasContent && 
				<Text 	style={ styles['wp-story-wrapper'] }>
						Empty Story placeholder here
				</Text>
			}	
			{ hasContent && 
				<View style={ styles['wp-story-wrapper'] }>
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
