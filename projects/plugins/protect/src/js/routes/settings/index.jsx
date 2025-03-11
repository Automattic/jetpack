import {
	Col,
	Container,
	Text,
	ToggleControl,
	AdminSectionHero,
	Notice,
	Button,
} from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import React from 'react';
import AdminPage from '../../components/admin-page';
import useAccountProtectionData from '../../hooks/use-account-protection-data';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import styles from './styles.module.scss';

const SettingsPage = () => {
	const SUPPORT_LINK = 'https://jetpack.com/?post_type=jetpack_support&p=324199';

	const { hasPlan } = usePlan();

	const {
		// config,
		isToggling,
		isEnabled,
		isSupported,
		hasUnsupportedJetpackVersion,
		toggleAccountProtection,
		// togglePasswordDetection,
		// toggleStrongPasswords,
	} = useAccountProtectionData();

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
					checked={ isSupported && ! hasUnsupportedJetpackVersion && isEnabled }
					onChange={ toggleAccountProtection }
					disabled={ ! isSupported || hasUnsupportedJetpackVersion || isToggling }
				/>
			</div>
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium">{ __( 'Account protection', 'jetpack-protect' ) }</Text>
				{ ! isSupported && (
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
								href={ SUPPORT_LINK + '#unsupported-environments' }
								key="learn-more"
							>
								{ __( 'Learn more', 'jetpack-protect' ) }
							</Button>,
						] }
					/>
				) }
				{ isSupported && hasUnsupportedJetpackVersion && (
					<Notice
						level="warning"
						hideCloseButton={ true }
						className={ styles[ 'toggle-section__alert' ] }
						title={
							<Text>
								{ __(
									'This feature has been disabled because Jetpack Protect is installed with an unsupported version of Jetpack. Please update Jetpack to version 14.5 or later to enable this feature.',
									'jetpack-protect'
								) }
							</Text>
						}
						actions={ [
							<Button
								variant="link"
								isExternalLink
								href={ SUPPORT_LINK + '#requirements' }
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
							link: <a href={ SUPPORT_LINK } target="_blank" rel="noopener noreferrer" />,
						}
					) }
				</Text>
				<Text>
					{ __(
						'Protect your site with advanced password detection and profile management protection.',
						'jetpack-protect'
					) }
				</Text>
				{ ! isEnabled && isSupported && (
					<Text className={ styles[ 'toggle-section__info' ] }>
						<Icon icon={ info } />
						{ createInterpolateElement(
							__(
								'Jetpack recommends enabling this feature. <link>Learn about the risks</link>.',
								'jetpack-protect'
							),
							{
								link: (
									<a
										href={ SUPPORT_LINK + '#risks-of-using-a-weak-password' }
										target="_blank"
										rel="noopener noreferrer"
									/>
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
