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

const alignToFlex = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
	full: 'center',
	wide: 'center',
};

/**
 * Internal dependencies
 */
import styles from './editor.scss';

const StoryEdit = ({
		attributes,
}) => {
	const { mediaFiles, align } = attributes;
	const hasContent = !! mediaFiles.length;
	return (
		<View style={ styles['wp-story-container'] }>
			{!hasContent && 
				<Text 	style={ styles['wp-story-wrapper'] }
				align={ align && alignToFlex[ align ] }
				align={ 'center' }

				 >
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
