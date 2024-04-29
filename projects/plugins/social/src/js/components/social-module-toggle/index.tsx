import { Text } from '@automattic/jetpack-components';
import { ConnectionManagement, SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';

const SocialModuleToggle: React.FC = () => {
	const { isModuleEnabled, isUpdating } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isModuleEnabled: store.isModuleEnabled(),
			isUpdating: store.isUpdatingJetpackSettings(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateJetpackSettings;

	const toggleModule = useCallback( () => {
		const newOption = {
			publicize_active: ! isModuleEnabled,
		};
		updateOptions( newOption );
	}, [ isModuleEnabled, updateOptions ] );

	return (
		<ToggleSection
			title={ __( 'Automatically share your posts to social networks', 'jetpack-social' ) }
			disabled={ isUpdating }
			checked={ isModuleEnabled }
			onChange={ toggleModule }
		>
			<Text className={ styles.text }>
				{ __(
					'When enabled, you’ll be able to connect your social media accounts and send a post’s featured image and content to the selected channels with a single click when the post is published.',
					'jetpack-social'
				) }
				&nbsp;
				<ExternalLink href="https://jetpack.com/redirect/?source=social-plugin-publicize-support-admin-page">
					{ __( 'Learn more', 'jetpack-social' ) }
				</ExternalLink>
			</Text>
			{ ! isUpdating && isModuleEnabled && (
				<ConnectionManagement className={ styles[ 'connection-management' ] } />
			) }
		</ToggleSection>
	);
};

export default SocialModuleToggle;
