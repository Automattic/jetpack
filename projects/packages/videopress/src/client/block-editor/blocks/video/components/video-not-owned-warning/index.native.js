/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
/**
 * External dependencies
 */
import { Text, View } from 'react-native';
/**
 * Internal dependencies
 */
import styles from './styles.scss';

/**
 * React component that renders a warning message about the video not owned by the site.
 *
 * @returns {import('react').ReactElement} - Details panel component.
 */
export default function VideoNotOwnedWarning() {
	const msgStyle = usePreferredColorSchemeStyle(
		styles[ 'video-not-owned-notice__message' ],
		styles[ 'video-not-owned-notice__message--dark' ]
	);
	const iconStyle = usePreferredColorSchemeStyle(
		styles[ 'video-not-owned-notice__icon' ],
		styles[ 'video-not-owned-notice__icon--dark' ]
	);
	return (
		<View style={ styles[ 'video-not-owned-notice__container' ] }>
			<Icon style={ iconStyle } icon={ warning } />
			<Text style={ msgStyle }>
				{ __(
					'This video is not owned by this site. You can still embed it and customize the player, but you won’t be able to edit the video.',
					'jetpack-videopress-pkg'
				) }
			</Text>
		</View>
	);
}
