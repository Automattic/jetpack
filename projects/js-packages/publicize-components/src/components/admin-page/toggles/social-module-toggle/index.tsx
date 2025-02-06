import {
	Button,
	ContextualUpgradeTrigger,
	Text,
	getRedirectUrl,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { ExternalLink } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { store as socialStore } from '../../../../social-store';
import { getSocialScriptData, hasSocialPaidFeatures } from '../../../../utils';
import ConnectionManagement from '../../../connection-management';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';

const SocialModuleToggle: React.FC = () => {
	const { isModuleEnabled, isUpdating } = useSelect( select => {
		const store = select( socialStore );

		const settings = store.getSocialModuleSettings();

		return {
			isModuleEnabled: settings.publicize,
			isUpdating: store.isSavingSocialModuleSettings(),
		};
	}, [] );

	const blogID = getScriptData().site.wpcom.blog_id;
	const siteSuffix = getScriptData().site.suffix;

	const { urls, feature_flags } = getSocialScriptData();

	const useAdminUiV1 = feature_flags.useAdminUiV1;

	const { updateSocialModuleSettings } = useDispatch( socialStore );

	const toggleModule = useCallback( async () => {
		const newOption = {
			publicize: ! isModuleEnabled,
		};
		await updateSocialModuleSettings( newOption );

		// If the module was enabled, we need to refresh the connection list
		if ( newOption.publicize && ! getSocialScriptData().is_publicize_enabled ) {
			window.location.reload();
		}
	}, [ isModuleEnabled, updateSocialModuleSettings ] );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const renderConnectionManagement = () => {
		if ( useAdminUiV1 ) {
			return isModuleEnabled ? (
				<ConnectionManagement
					className={ styles[ 'connection-management' ] }
					disabled={ isUpdating }
				/>
			) : null;
		}

		return urls.connectionsManagementPage ? (
			<Button
				fullWidth={ isSmall }
				className={ styles.button }
				variant="secondary"
				isExternalLink={ true }
				href={ urls.connectionsManagementPage }
				disabled={ isUpdating || ! isModuleEnabled }
				target="_blank"
			>
				{ __( 'Manage social media connections', 'jetpack-publicize-components' ) }
			</Button>
		) : null;
	};

	return (
		<ToggleSection
			title={ __(
				'Automatically share your posts to social networks',
				'jetpack-publicize-components'
			) }
			disabled={ isUpdating }
			checked={ isModuleEnabled }
			onChange={ toggleModule }
		>
			<Text className={ styles.text }>
				{ __(
					'When enabled, you’ll be able to connect your social media accounts and send a post’s featured image and content to the selected channels with a single click when the post is published.',
					'jetpack-publicize-components'
				) }
				&nbsp;
				<ExternalLink href="https://jetpack.com/redirect/?source=social-plugin-publicize-support-admin-page">
					{ __( 'Learn more', 'jetpack-publicize-components' ) }
				</ExternalLink>
			</Text>
			{ ! hasSocialPaidFeatures() ? (
				<ContextualUpgradeTrigger
					className={ clsx( styles.cut, { [ styles.small ]: isSmall } ) }
					description={ __( 'Unlock advanced sharing options', 'jetpack-publicize-components' ) }
					cta={ __( 'Power up Jetpack Social', 'jetpack-publicize-components' ) }
					href={ getRedirectUrl( 'jetpack-social-admin-page-upsell', {
						site: `${ blogID ?? siteSuffix }`,
						query: 'redirect_to=admin.php?page=jetpack-social',
					} ) }
					tooltipText={ __(
						'Share custom images and videos that capture attention, use our powerful Social Image Generator to create stunning visuals, and access priority support for expert help whenever you need it.',
						'jetpack-publicize-components'
					) }
				/>
			) : null }
			{ renderConnectionManagement() }
		</ToggleSection>
	);
};

export default SocialModuleToggle;
