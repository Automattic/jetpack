/**
 *External dependencies
 */
import { useNavigation } from '@react-navigation/native';
import { PanelBody, SelectControl, ToggleControl, BottomSheet } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import {
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
	VIDEO_RATING_G,
	VIDEO_RATING_PG_13,
	VIDEO_RATING_R_17,
} from '../../../../../state/constants';
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

	const { privacySetting, rating, allowDownload, displayEmbed } = attributes;

	const privacyLabels = {
		private: _x( 'Site Default (Private)', 'VideoPress privacy setting', 'jetpack-videopress-pkg' ),
		public: _x( 'Site Default (Public)', 'VideoPress privacy setting', 'jetpack-videopress-pkg' ),
	};

	const privacyOptionSiteDefault = {
		value: String( VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_SITE_DEFAULT ) ),
		label: privateEnabledForSite ? privacyLabels.private : privacyLabels.public,
	};
	const privacyOptionPublic = {
		value: String( VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PUBLIC ) ),
		label: _x( 'Public', 'VideoPress privacy setting', 'jetpack-videopress-pkg' ),
	};
	const privacyOptionPrivate = {
		value: String( VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PRIVATE ) ),
		label: _x( 'Private', 'VideoPress privacy setting', 'jetpack-videopress-pkg' ),
	};

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

				<PanelBody initialOpen={ false }>
					<SelectControl
						label={ _x( 'Rating', 'The age rating for this video.', 'jetpack-videopress-pkg' ) }
						value={ rating ?? '' }
						options={ [
							{
								label: _x( 'G', 'Video rating for "General Audiences".', 'jetpack-videopress-pkg' ),
								value: VIDEO_RATING_G,
							},
							{
								label: _x(
									'PG-13',
									'Video rating for "Parental Guidance", unsuitable for children under 13.',
									'jetpack-videopress-pkg'
								),
								value: VIDEO_RATING_PG_13,
							},
							{
								label: _x(
									'R',
									'Video rating for "Restricted", not recommended for children under 17.',
									'jetpack-videopress-pkg'
								),
								value: VIDEO_RATING_R_17,
							},
						] }
						onChange={ value => {
							setAttributes( { rating: value } );
						} }
					/>

					<SelectControl
						label={ __( 'Privacy', 'jetpack-videopress-pkg' ) }
						onChange={ value => {
							const attrsToUpdate: {
								privacySetting?: number;
								isPrivate?: boolean;
							} = {};

							// Anticipate the isPrivate attribute.
							if ( value !== privacyOptionSiteDefault.value ) {
								attrsToUpdate.isPrivate = value === privacyOptionPrivate.value;
							} else {
								attrsToUpdate.isPrivate = privateEnabledForSite;
							}

							attrsToUpdate.privacySetting = Number( value );
							setAttributes( attrsToUpdate );
						} }
						value={ String( privacySetting ) }
						options={ [ privacyOptionSiteDefault, privacyOptionPublic, privacyOptionPrivate ] }
					/>

					<ToggleControl
						label={ __( 'Allow download', 'jetpack-videopress-pkg' ) }
						checked={ allowDownload }
						onChange={ value => {
							setAttributes( { allowDownload: value } );
						} }
					/>

					<ToggleControl
						label={ __( 'Show video sharing menu', 'jetpack-videopress-pkg' ) }
						checked={ displayEmbed }
						onChange={ value => {
							setAttributes( { displayEmbed: value } );
						} }
						help={ __(
							'Gives viewers the option to share the video link and HTML embed code',
							'jetpack-videopress-pkg'
						) }
					/>
				</PanelBody>
			</>
		</BottomSheet.SubSheet>
	);
}
