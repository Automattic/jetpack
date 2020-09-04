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

const StoryEdit = ({
		attributes,
}) => {
	const { align, content, level, placeholder, width, mediaFiles } = attributes;
	const hasImages = !! mediaFiles.length;
	return (
		<View>
			{! hasImages && 
				<Text>Empty Story placeholder here</Text>
			}
			{ hasImages && 
				<Image
					align={ align && alignToFlex[ align ] }
					url={ mediaFiles[0].url } // just select the first one
					width={ width }
				/>
			}
		</View>
	);
};

export default StoryEdit;
