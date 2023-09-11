/**
 * External dependencies
 */
import { Col, Container, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { usePermission } from '../../hooks/use-permission';
import { useVideoPressSettings } from '../../hooks/use-videopress-settings';
import { CheckboxCheckmark } from '../video-filter';
import { SITE_TYPE_ATOMIC } from './constants';
import { SiteSettingsSectionProps } from './types';
/**
 * Types
 */
import type React from 'react';

/**
 * VideoPress SettingsSection component
 *
 * @param {SiteSettingsSectionProps} props - Component props.
 * @returns {React.ReactElement}   Component template
 */
const SiteSettingsSection: React.FC< SiteSettingsSectionProps > = ( {
	videoPressVideosPrivateForSite,
	siteIsPrivate,
	siteType,
	onPrivacyChange,
} ) => {
	const { canPerformAction } = usePermission();
	const siteIsAtomicPrivate = siteIsPrivate && siteType === SITE_TYPE_ATOMIC;
	const disablePrivacyToggle = ! canPerformAction || siteIsAtomicPrivate;
	const disabledReason = siteIsAtomicPrivate
		? __(
				'You cannot change this setting because your site is private. You can only choose the video privacy default on public sites.',
				'jetpack-videopress-pkg'
		  )
		: null;

	return (
		<Container horizontalSpacing={ 0 } horizontalGap={ 0 }>
			<Col>
				<Text variant="headline-small" mb={ 1 }>
					{ __( 'Settings', 'jetpack-videopress-pkg' ) }
				</Text>
			</Col>
			<Col sm={ 12 } md={ 12 } lg={ 12 }>
				<CheckboxCheckmark
					for={ 'settings-site-privacy' }
					label={ __(
						'Video Privacy: Restrict views to members of this site',
						'jetpack-videopress-pkg'
					) }
					onChange={ onPrivacyChange }
					checked={ videoPressVideosPrivateForSite }
					disabled={ disablePrivacyToggle }
					disabledReason={ disabledReason }
				/>
			</Col>
		</Container>
	);
};

export const ConnectSiteSettingsSection = () => {
	const { settings, onUpdate } = useVideoPressSettings();
	const { videoPressVideosPrivateForSite, siteIsPrivate, siteType } = settings;
	return (
		<SiteSettingsSection
			videoPressVideosPrivateForSite={ videoPressVideosPrivateForSite }
			siteIsPrivate={ siteIsPrivate }
			siteType={ siteType }
			onPrivacyChange={ newPrivacyValue => {
				onUpdate( {
					videoPressVideosPrivateForSite: newPrivacyValue,
				} );
			} }
		/>
	);
};

export default SiteSettingsSection;
