/**
 * WordPress dependencies
 */
import { BottomSheet, Icon } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { help } from '@wordpress/icons';
/**
 * External dependencies
 */
import { Text, View } from 'react-native';
/**
 * Internal dependencies
 */
import styles from './style.scss';

const PlayerUnavailable = ( { isSheetVisible, onCloseSheet } ) => {
	const sheetIconStyle = usePreferredColorSchemeStyle(
		styles[ 'videopress-player-unavailable__sheet-icon' ],
		styles[ 'videopress-player-unavailable__sheet-icon--dark' ]
	);
	const sheetTitleStyle = usePreferredColorSchemeStyle(
		styles[ 'videopress-player-unavailable__sheet-title' ],
		styles[ 'videopress-player-unavailable__sheet-title--dark' ]
	);
	const sheetDescriptionStyle = usePreferredColorSchemeStyle(
		styles[ 'videopress-player-unavailable__sheet-description' ],
		styles[ 'videopress-player-unavailable__sheet-description--dark' ]
	);

	return (
		<BottomSheet
			isVisible={ isSheetVisible }
			hideHeader
			onClose={ onCloseSheet }
			testID="videopress-player-unavailable"
		>
			<View style={ styles[ 'videopress-player-unavailable__container' ] }>
				<View style={ sheetIconStyle }>
					<Icon icon={ help } fill={ sheetIconStyle.fill } size={ sheetIconStyle.width } />
				</View>
				<Text style={ sheetTitleStyle }>
					{ __( "VideoPress videos can't be played.", 'jetpack-videopress-pkg' ) }
				</Text>
				<Text style={ sheetDescriptionStyle }>
					{ __(
						'We’re working hard on adding support for playing VideoPress videos.',
						'jetpack-videopress-pkg'
					) }
				</Text>
			</View>
		</BottomSheet>
	);
};

export default PlayerUnavailable;
