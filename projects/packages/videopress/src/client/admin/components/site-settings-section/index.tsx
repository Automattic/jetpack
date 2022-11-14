/**
 * External dependencies
 */
import { Col, Container, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { useVideoPressSettings } from '../../hooks/use-videopress-settings';
/**
 * Internal dependencies
 */
import { CheckboxCheckmark } from '../video-filter';
import { SiteSettingsSectionProps } from './types';

/**
 * VideoPress SettingsSection component
 *
 * @param {SiteSettingsSectionProps} props - Component props.
 * @returns {React.ReactElement}   Component template
 */
const SiteSettingsSection: React.FC< SiteSettingsSectionProps > = ( {
	videoPressVideosPrivateForSite,
	onPrivacyChange,
} ) => {
	return (
		<Container horizontalSpacing={ 0 } horizontalGap={ 0 }>
			<Col>
				<Text variant="headline-small" mb={ 1 }>
					{ __( 'Settings', 'jetpack-videopress-pkg' ) }
				</Text>
			</Col>
			<Col sm={ 12 } md={ 6 } lg={ 6 }>
				<CheckboxCheckmark
					for={ 'settings-site-privacy' }
					label={ __(
						'Video Privacy: Restrict views to members of this site',
						'jetpack-videopress-pkg'
					) }
					onChange={ onPrivacyChange }
					checked={ videoPressVideosPrivateForSite }
				/>
			</Col>
		</Container>
	);
};

export const ConnectSiteSettingsSection = () => {
	const { settings, onUpdate } = useVideoPressSettings();
	const { videoPressVideosPrivateForSite } = settings;
	return (
		<SiteSettingsSection
			videoPressVideosPrivateForSite={ videoPressVideosPrivateForSite }
			onPrivacyChange={ newPrivacyValue => {
				onUpdate( {
					videoPressVideosPrivateForSite: newPrivacyValue,
				} );
			} }
		/>
	);
};

export default SiteSettingsSection;
