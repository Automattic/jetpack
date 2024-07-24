import {
	Button,
	ContextualUpgradeTrigger,
	Text,
	getRedirectUrl,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { ConnectionManagement, SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';

const SocialModuleToggle: React.FC = () => {
	const {
		connectionsAdminUrl,
		isModuleEnabled,
		isUpdating,
		useAdminUiV1,
		siteSuffix,
		blogID,
		hasPaidFeatures,
	} = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isModuleEnabled: store.isModuleEnabled(),
			isUpdating: store.isUpdatingJetpackSettings(),
			connectionsAdminUrl: store.getConnectionsAdminUrl(),
			useAdminUiV1: store.useAdminUiV1(),
			siteSuffix: store.getSiteSuffix(),
			blogID: store.getBlogID(),
			hasPaidFeatures: store.hasPaidFeatures(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateJetpackSettings;

	const toggleModule = useCallback( async () => {
		const newOption = {
			publicize_active: ! isModuleEnabled,
		};
		await updateOptions( newOption );

		// If the module was enabled, we need to refresh the connection list
		if ( newOption.publicize_active && ! window.jetpackSocialInitialState.is_publicize_enabled ) {
			window.location.reload();
		}
	}, [ isModuleEnabled, updateOptions ] );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const renderConnectionManagement = () => {
		if ( useAdminUiV1 ) {
			return ! isUpdating && isModuleEnabled ? (
				<ConnectionManagement className={ styles[ 'connection-management' ] } />
			) : null;
		}

		return connectionsAdminUrl ? (
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
		) : null;
	};

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
			{ ! hasPaidFeatures ? (
				<ContextualUpgradeTrigger
					className={ clsx( styles.cut, { [ styles.small ]: isSmall } ) }
					description={ __( 'Unlock advanced sharing options', 'jetpack-social' ) }
					cta={ __( 'Power up Jetpack Social', 'jetpack-social' ) }
					href={ getRedirectUrl( 'jetpack-social-admin-page-upsell', {
						site: `${ blogID ?? siteSuffix }`,
						query: 'redirect_to=admin.php?page=jetpack-social',
					} ) }
					tooltipText={ __(
						'Get access to priority support, engagement optimization options like image and video sharing, and Social Image Generator.',
						'jetpack-social'
					) }
				/>
			) : null }
			{ renderConnectionManagement() }
		</ToggleSection>
	);
};

export default SocialModuleToggle;
