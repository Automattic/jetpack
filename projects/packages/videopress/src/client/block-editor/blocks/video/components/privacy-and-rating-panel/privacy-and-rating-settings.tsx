/**
 * External dependencies
 */
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
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
import type { PrivacyAndRatingPanelProps } from '../../types';
import type React from 'react';

/**
 * React component that renders the settings within the privacy and ratings panel.
 *
 * @param {PrivacyAndRatingPanelProps} props - Component props.
 * @returns {React.ReactElement}               Settings to change video's privacy and ratings.
 */
export default function PrivacyAndRatingSettings( {
	attributes,
	setAttributes,
	privateEnabledForSite,
	videoBelongToSite,
}: PrivacyAndRatingPanelProps ): React.ReactElement {
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
		<PanelBody title={ __( 'Privacy and rating', 'jetpack-videopress-pkg' ) } initialOpen={ false }>
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
				disabled={ ! videoBelongToSite }
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
				disabled={ ! videoBelongToSite }
			/>

			<ToggleControl
				label={ __( 'Allow download', 'jetpack-videopress-pkg' ) }
				checked={ allowDownload }
				onChange={ value => {
					setAttributes( { allowDownload: value } );
				} }
				disabled={ ! videoBelongToSite }
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
				disabled={ ! videoBelongToSite }
			/>
		</PanelBody>
	);
}
