/**
 *External dependencies
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
 * Types
 */
import type { VideoControlProps } from '../../types';
import type React from 'react';

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export default function PrivacyAndRatingPanel( {
	attributes,
	setAttributes,
	privateEnabledForSite,
}: VideoControlProps ): React.ReactElement {
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
				<PrivacyAndRatingSettings { ...{ attributes, setAttributes, privateEnabledForSite } } />
			</>
		</BottomSheet.SubSheet>
	);
}
