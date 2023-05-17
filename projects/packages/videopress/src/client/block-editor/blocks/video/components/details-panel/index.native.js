/**
 * WordPress dependencies
 */
import { PanelBody, TextControl, BottomSheetTextControl } from '@wordpress/components';
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
 * React component that renders the details settings panel.
 *
 * @param {object} props - Component properties.
 * @param {object} props.attributes - Block attributes.
 * @param {Function} props.setAttributes - Function to set attributes.
 * @param {Function} props.videoBelongToSite - Determines if the video belongs to the current site.
 * @returns {import('react').ReactElement} - Details panel component.
 */
export default function DetailsPanel( { attributes, setAttributes, videoBelongToSite } ) {
	const { title, description } = attributes;

	const msgStyle = usePreferredColorSchemeStyle(
		styles[ 'video-not-owned-notice__message' ],
		styles[ 'video-not-owned-notice__message--dark' ]
	);
	const iconStyle = usePreferredColorSchemeStyle(
		styles[ 'video-not-owned-notice__icon' ],
		styles[ 'video-not-owned-notice__icon--dark' ]
	);
	const videoNotOwnedMessage = (
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

	return (
		<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
			<TextControl
				value={ title || '' }
				onChange={ value => setAttributes( { title: value } ) }
				placeholder={ __( 'Add title', 'jetpack-videopress-pkg' ) }
				label={ __( 'Title', 'jetpack-videopress-pkg' ) }
				disabled={ ! videoBelongToSite }
			/>
			<BottomSheetTextControl
				initialValue={ description }
				onChange={ value => setAttributes( { description: value } ) }
				placeholder={ __( 'Add description', 'jetpack-videopress-pkg' ) }
				label={ __( 'Description', 'jetpack-videopress-pkg' ) }
				disabled={ ! videoBelongToSite }
			/>
			{ ! videoBelongToSite && videoNotOwnedMessage }
		</PanelBody>
	);
}
