import { IconTooltip, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import { store as socialStore } from '../../../../social-store';
import { getRefreshPlanQuery, getSocialScriptData, hasSocialPaidFeatures } from '../../../../utils';
import { canToggleSocialModule } from '../../../../utils/misc';
import ConnectionManagement from '../../../connection-management';
import { MessageTemplateSection } from '../../message-template-section';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';
import type { FC } from 'react';

const SocialModuleToggle: FC = () => {
	const { isModuleEnabled, isUpdating } = useSelect( select => {
		const store = select( socialStore );

		const settings = store.getSocialModuleSettings();

		return {
			isModuleEnabled: settings.publicize,
			isUpdating: store.isSavingSocialModuleSettings(),
		};
	}, [] );

	const { wpcom, host, suffix: siteSuffix } = getScriptData().site;
	const is_wpcom = host === 'wpcom';

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

	const isSmall = useViewportMatch( 'small', '<' );

	const renderConnectionManagement = () => {
		return isModuleEnabled ? (
			<ConnectionManagement
				className={ styles[ 'connection-management' ] }
				disabled={ isUpdating }
			/>
		) : null;
	};

	const hideToggle = ! canToggleSocialModule();
	return (
		<ToggleSection
			hideToggle={ hideToggle }
			title={ __( 'Automatically share your posts to social networks', 'jetpack-publicize-pkg' ) }
			disabled={ isUpdating }
			checked={ isModuleEnabled }
			onChange={ toggleModule }
		>
			<Text className={ styles.text }>
				{ ! hideToggle
					? _x(
							'When enabled, you’ll be able to connect your social media accounts and send a post’s featured image and content to the selected channels with a single click when the post is published.',
							'Description of the feature that the toggle enables',
							'jetpack-publicize-pkg'
					  )
					: __(
							'Connect your social media accounts and send a post’s featured image and content to the selected channels with a single click when the post is published.',
							'jetpack-publicize-pkg'
					  ) }
				&nbsp;
				<Link
					openInNewTab
					href={
						is_wpcom
							? getRedirectUrl( 'wpcom-social-plugin-publicize-support-admin-page' )
							: getRedirectUrl( 'social-plugin-publicize-support-admin-page' )
					}
					className={ styles.learn }
				>
					{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
				</Link>
			</Text>
			{ ! isWpcomPlatformSite() && ! hasSocialPaidFeatures() ? (
				<Notice.Root intent="info" className={ clsx( styles.cut, { [ styles.small ]: isSmall } ) }>
					<Notice.Description>
						{ __( 'Unlock advanced sharing options', 'jetpack-publicize-pkg' ) }{ ' ' }
						<IconTooltip className={ styles[ 'upgrade-tooltip' ] } iconSize={ 16 } offset={ 4 }>
							<Text variant="body-small">
								{ __(
									'Share custom images and videos that capture attention, use our powerful Social Image Generator to create stunning visuals, and access priority support for expert help whenever you need it.',
									'jetpack-publicize-pkg'
								) }
							</Text>
						</IconTooltip>
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionLink
							href={ getRedirectUrl( 'jetpack-social-admin-page-upsell', {
								site: `${ wpcom.blog_id ?? siteSuffix }`,
								query: getRefreshPlanQuery(),
							} ) }
						>
							{ __( 'Power up Jetpack Social', 'jetpack-publicize-pkg' ) }
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			) : null }
			{ isModuleEnabled && <MessageTemplateSection disabled={ isUpdating } /> }
			{ renderConnectionManagement() }
		</ToggleSection>
	);
};

export default SocialModuleToggle;
