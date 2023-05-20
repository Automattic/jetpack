/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';
import { BottomSheet } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import PrivacyAndRatingSettings from './privacy-and-rating-settings';

/**
 * React component that renders the main privacy and ratings panel.
 *
 * @param {object} props - Component props.
 * @param {object} props.attributes - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.privateEnabledForSite	- True if the site's privacy is set to Private.
 * @param {boolean} props.videoBelongToSite - Determines if the video belongs to the current site.
 * @returns {import('react').ReactElement} - Panel to contain privacy and ratings settings.
 */
export default function PrivacyAndRatingPanel( {
	attributes,
	setAttributes,
	privateEnabledForSite,
	videoBelongToSite,
} ) {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const goBack = useCallback( () => {
		setShowSubSheet( false );
		navigation.goBack();
	}, [] );

	const openSubSheet = useCallback( () => {
		navigation.navigate( BottomSheet.SubSheet.screenName );
		setShowSubSheet( true );
	}, [] );

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					label={ __( 'Privacy and Rating', 'jetpack-videopress-pkg' ) }
					onPress={ openSubSheet }
					leftAlign
				>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.BackButton onPress={ goBack } />
					<BottomSheet.NavBar.Heading>
						{ __( 'Privacy and Rating', 'jetpack-videopress-pkg' ) }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<PrivacyAndRatingSettings
					{ ...{ attributes, setAttributes, privateEnabledForSite, videoBelongToSite } }
				/>
			</>
		</BottomSheet.SubSheet>
	);
}
