/**
 *External dependencies
 */
import { PanelBody, SelectControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
} from '../../../../../state/constants';
import { VideoControlProps } from '../../types';
import type React from 'react';

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export default function PrivacyAndRatingPanel( { attributes, setAttributes }: VideoControlProps ) {
	const { privacySetting } = attributes;

	return (
		<PanelBody title={ __( 'Privacy and rating', 'jetpack-videopress-pkg' ) } initialOpen={ false }>
			<SelectControl
				label={ __( 'Privacy', 'jetpack-videopress-pkg' ) }
				onChange={ value => {
					setAttributes( { privacySetting: Number( value ) } );
				} }
				value={ String( privacySetting ) }
				options={ [
					{
						value: String( VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_SITE_DEFAULT ) ),
						label: _x( 'Site Default', 'VideoPress privacy setting', 'jetpack-videopress-pkg' ),
					},
					{
						value: String( VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PUBLIC ) ),
						label: _x( 'Public', 'VideoPress privacy setting', 'jetpack-videopress-pkg' ),
					},
					{
						value: String( VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PRIVATE ) ),
						label: _x( 'Private', 'VideoPress privacy setting', 'jetpack-videopress-pkg' ),
					},
				] }
			/>
		</PanelBody>
	);
}
