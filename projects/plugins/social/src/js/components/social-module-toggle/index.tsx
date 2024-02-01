import { Button, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';

const SocialModuleToggle: React.FC = () => {
	const { connectionsAdminUrl, isModuleEnabled, isUpdating } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isModuleEnabled: store.isModuleEnabled(),
			isUpdating: store.isUpdatingJetpackSettings(),
			connectionsAdminUrl: store.getConnectionsAdminUrl(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateJetpackSettings;

	const toggleModule = useCallback( () => {
		const newOption = {
			publicize_active: ! isModuleEnabled,
		};
		updateOptions( newOption );
	}, [ isModuleEnabled, updateOptions ] );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

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
			{ connectionsAdminUrl && (
				<Button
					fullWidth={ isSmall }
					className={ styles.button }
					variant="secondary"
					isExternalLink={ true }
					href={ connectionsAdminUrl }
					disabled={ isUpdating || ! isModuleEnabled }
					target="_blank"
				>
					{ __( 'Manage social media connections', 'jetpack-social' ) }
				</Button>
			) }
		</ToggleSection>
	);
};

export default SocialModuleToggle;
