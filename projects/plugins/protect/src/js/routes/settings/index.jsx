import {
	Col,
	Container,
	Text,
	ToggleControl,
	AdminSectionHero,
	Notice,
	Button,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import React, { useCallback } from 'react';
import AdminPage from '../../components/admin-page';
import useAccountProtectionQuery from '../../data/account-protection/use-account-protection-query';
import useToggleAccountProtectionMutation from '../../data/account-protection/use-toggle-account-protection-module-mutation';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import styles from './styles.module.scss';

const SettingsPage = () => {
	const { hasPlan } = usePlan();
	const { data: accountProtection } = useAccountProtectionQuery();
	const toggleAccountProtectionMutation = useToggleAccountProtectionMutation();

	/**
	 * Toggle Account Protect Module
	 *
	 * Flips the switch on the Account Protection module, and then refreshes the data.
	 */
	const toggleAccountProtection = useCallback( async () => {
		toggleAccountProtectionMutation.mutate();
	}, [ toggleAccountProtectionMutation ] );

	// Track view for Protect Account Protection page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_account_protection',
		pageViewEventProperties: {
			has_plan: hasPlan,
		},
	} );

	const accountProtectionSettings = (
		<div className={ styles[ 'toggle-section' ] }>
			<div className={ styles[ 'toggle-section__control' ] }>
				<ToggleControl
					checked={
						accountProtection.isSupported &&
						! accountProtection.hasUnsupportedJetpackVersion &&
						accountProtection.isEnabled
					}
					onChange={ toggleAccountProtection }
					disabled={
						! accountProtection.isSupported ||
						accountProtection.hasUnsupportedJetpackVersion ||
						toggleAccountProtectionMutation.isPending
					}
				/>
			</div>
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium">{ __( 'Account protection', 'jetpack-protect' ) }</Text>
				{ ! accountProtection.isSupported && (
					<Notice
						level="warning"
						hideCloseButton={ true }
						className={ styles[ 'toggle-section__alert' ] }
						title={
							<Text>
								{ __(
									'This feature has been disabled by your site administrator or hosting provider.',
									'jetpack-protect'
								) }
							</Text>
						}
						actions={ [
							<Button
								variant="link"
								isExternalLink
								href={ getRedirectUrl( 'jetpack-account-protection', {
									anchor: 'unsupported-environments',
								} ) }
								key="learn-more"
							>
								{ __( 'Learn more', 'jetpack-protect' ) }
							</Button>,
						] }
					/>
				) }
				{ accountProtection.isSupported && accountProtection.hasUnsupportedJetpackVersion && (
					<Notice
						level="warning"
						hideCloseButton={ true }
						className={ styles[ 'toggle-section__alert' ] }
						title={
							<Text>
								{ __(
									'This feature has been disabled because the Jetpack Protect plugin is installed with an unsupported version of the Jetpack plugin. Please update the Jetpack plugin to version 14.5 or later to enable this feature.',
									'jetpack-protect'
								) }
							</Text>
						}
						actions={ [
							<Button
								variant="link"
								isExternalLink
								href={ getRedirectUrl( 'jetpack-account-protection', {
									anchor: 'requirements',
								} ) }
								key="learn-more"
							>
								{ __( 'Learn more', 'jetpack-protect' ) }
							</Button>,
						] }
					/>
				) }
				<Text className={ styles[ 'toggle-section__description' ] }>
					{ createInterpolateElement(
						__(
							'Enabling this setting enhances account security by detecting compromised passwords and enforcing additional verification when needed. Learn more about <link>how this protects your site</link>.',
							'jetpack-protect'
						),
						{
							link: <ExternalLink href={ getRedirectUrl( 'jetpack-account-protection' ) } />,
						}
					) }
				</Text>
				<Text>
					{ __(
						'Protect your site with advanced password detection and profile management protection.',
						'jetpack-protect'
					) }
				</Text>
				{ ! accountProtection.isEnabled && accountProtection.isSupported && (
					<Text className={ styles[ 'toggle-section__info' ] }>
						<Icon icon={ info } />
						{ createInterpolateElement(
							__(
								'Jetpack recommends enabling this feature to enhance account security. <link>Learn about the risks</link>.',
								'jetpack-protect'
							),
							{
								link: (
									<ExternalLink href={ getRedirectUrl( 'jetpack-account-protection-risks' ) } />
								),
							}
						) }
					</Text>
				) }
			</div>
		</div>
	);

	/**
	 * Render
	 */
	return (
		<AdminPage>
			<AdminSectionHero>
				<Container className={ styles.container } horizontalSpacing={ 8 } horizontalGap={ 4 }>
					<Col>
						<div className={ styles[ 'toggle-wrapper' ] }>{ accountProtectionSettings }</div>
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default SettingsPage;
