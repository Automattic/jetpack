import { Icon } from '@wordpress/components';
import { TouchableWithoutFeedback, View } from 'react-native';
import styles from './editor.scss';
import SvgIconCustomize from './icon-customize';

const StoryEditingButton = ( { onEditButtonTapped } ) => {
	return (
		<TouchableWithoutFeedback onPress={ onEditButtonTapped }>
			<View style={ styles.editContainer }>
				<View style={ styles.edit }>
					{ /* { mediaOptions() } */ }
					<Icon size={ 16 } icon={ SvgIconCustomize } { ...styles.iconCustomize } />
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default StoryEditingButton;
