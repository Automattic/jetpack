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
		config: {
			supportsAdvancedOptions,
			jetpackAccountProtectionPasswordDetection,
			jetpackAccountProtectionStrongPasswords,
		},
		isEnabled,
		isSupported,
		hasUnsupportedJetpackVersion,
		isToggling,
		isUpdating,
		toggleAccountProtection,
		togglePasswordDetection,
		toggleStrongPasswords,
	} = useAccountProtectionData();

	// Track view for Protect Account Protection page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_account_protection',
		pageViewEventProperties: {
			has_plan: hasPlan,
		},
	} );

	const isFeatureAvailable = isSupported && ! hasUnsupportedJetpackVersion && isEnabled;

	const renderNotice = () => {
		if ( ! isSupported ) {
			return (
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
			);
		}

		if ( hasUnsupportedJetpackVersion ) {
			return (
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
			);
		}

		if ( ! isEnabled && supportsAdvancedOptions ) {
			return (
				<Notice
					level="error"
					hideCloseButton={ true }
					className={ styles[ 'toggle-section__alert' ] }
					title="Account protection is currently inactive."
					children={ <Text>{ __( 'Activate the feature to continue.', 'jetpack-protect' ) }</Text> }
					actions={ [
						<Button
							key="enable"
							variant="link"
							onClick={ toggleAccountProtection }
							isLoading={ isToggling }
							disabled={ isToggling }
						>
							{ __( 'Activate', 'jetpack-protect' ) }
						</Button>,
					] }
				/>
			);
		}

		return null;
	};

	// const ToggleSection = ( {
	// 	displayToggle = true,
	// 	title,
	// 	description,
	// 	checked,
	// 	onChange,
	// 	disabled,
	// 	extras = null,
	// } ) => (
	// 	<div className={ styles[ 'toggle-section' ] }>
	// 		{ displayToggle && (
	// 			<div className={ styles[ 'toggle-section__control' ] }>
	// 				<ToggleControl checked={ checked } onChange={ onChange } disabled={ disabled } />
	// 			</div>
	// 		) }
	// 		<div className={ styles[ 'toggle-section__content' ] }>
	// 			<Text variant="title-medium">{ title }</Text>
	// 			<Text className={ styles[ 'toggle-section__description' ] }>{ description }</Text>
	// 			{ extras }
	// 		</div>
	// 	</div>
	// );

	const renderAccountProtectionDescription = () => {
		const translatedText = supportsAdvancedOptions
			? __(
					'Enabling these settings enhances account security by detecting compromised passwords and enforcing additional verification when needed. Learn more about <link>how this protects your site</link>.',
					'jetpack-protect'
			  )
			: __(
					'Enabling this setting enhances account security by detecting compromised passwords and enforcing additional verification when needed. Learn more about <link>how this protects your site</link>.',
					'jetpack-protect'
			  );

		return createInterpolateElement( translatedText, {
			link: <a href={ SUPPORT_LINK } target="_blank" rel="noopener noreferrer" />,
		} );
	};

	const accountProtectionSettings = (
		<div className={ styles[ 'toggle-section' ] }>
			{ ! supportsAdvancedOptions && (
				<div className={ styles[ 'toggle-section__control' ] }>
					<ToggleControl
						checked={ isFeatureAvailable }
						onChange={ toggleAccountProtection }
						disabled={ ! isSupported || hasUnsupportedJetpackVersion || isToggling }
					/>
				</div>
			) }
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium">{ __( 'Account protection', 'jetpack-protect' ) }</Text>
				{ renderNotice() }
				<Text className={ styles[ 'toggle-section__description' ] }>
					{ renderAccountProtectionDescription() }
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

	const passwordDetectionSettings = (
		<div className={ styles[ 'toggle-section' ] }>
			<div className={ styles[ 'toggle-section__control' ] }>
				<ToggleControl
					checked={ isFeatureAvailable && jetpackAccountProtectionPasswordDetection }
					onChange={ togglePasswordDetection }
					disabled={ ! isFeatureAvailable || isToggling || isUpdating }
				/>
			</div>
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium">{ __( 'Password detection', 'jetpack-protect' ) }</Text>
				<Text className={ styles[ 'toggle-section__description' ] }>
					{ __(
						'Detect and prevent the use of compromised passwords that have been exposed in data breaches.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);

	const strongPasswordsSettings = (
		<div className={ styles[ 'toggle-section' ] }>
			<div className={ styles[ 'toggle-section__control' ] }>
				<ToggleControl
					checked={ isFeatureAvailable && jetpackAccountProtectionStrongPasswords }
					onChange={ toggleStrongPasswords }
					disabled={ ! isFeatureAvailable || isToggling || isUpdating }
				/>
			</div>
			<div className={ styles[ 'toggle-section__content' ] }>
				<Text variant="title-medium">{ __( 'Strong passwords', 'jetpack-protect' ) }</Text>
				<Text className={ styles[ 'toggle-section__description' ] }>
					{ __(
						'Enforce strong password requirements for all users to enhance account security.',
						'jetpack-protect'
					) }
				</Text>
			</div>
		</div>
	);

	// const accountProtectionSettings = (
	// 	<ToggleSection
	// 		displayToggle={ ! supportsAdvancedOptions }
	// 		title={ __( 'Account protection', 'jetpack-protect' ) }
	// 		description={ renderAccountProtectionDescription() }
	// 		checked={ isFeatureAvailable }
	// 		onChange={ toggleAccountProtection }
	// 		disabled={ ! isSupported || hasUnsupportedJetpackVersion || isToggling }
	// 		extras={
	// 			! isEnabled &&
	// 			isSupported && (
	// 				<Text className={ styles[ 'toggle-section__info' ] }>
	// 					<Icon icon={ info } />
	// 					{ createInterpolateElement(
	// 						__(
	// 							'Jetpack recommends enabling this feature. <link>Learn about the risks</link>.',
	// 							'jetpack-protect'
	// 						),
	// 						{
	// 							link: (
	// 								<a
	// 									href={ SUPPORT_LINK + '#risks-of-using-a-weak-password' }
	// 									target="_blank"
	// 									rel="noopener noreferrer"
	// 								/>
	// 							),
	// 						}
	// 					) }
	// 				</Text>
	// 			)
	// 		}
	// 	/>
	// );

	// const passwordDetectionSettings = (
	// 	<ToggleSection
	// 		title={ __( 'Password detection', 'jetpack-protect' ) }
	// 		description={ __(
	// 			'Detect and prevent the use of compromised passwords that have been exposed in data breaches.',
	// 			'jetpack-protect'
	// 		) }
	// 		checked={ isFeatureAvailable && jetpackAccountProtectionPasswordDetection }
	// 		onChange={ togglePasswordDetection }
	// 		disabled={ ! isFeatureAvailable || isToggling || isUpdating }
	// 	/>
	// );

	// const strongPasswordsSettings = (
	// 	<ToggleSection
	// 		title={ __( 'Strong passwords', 'jetpack-protect' ) }
	// 		description={ __(
	// 			'Enforce strong password requirements for all users to enhance account security.',
	// 			'jetpack-protect'
	// 		) }
	// 		checked={ isFeatureAvailable && jetpackAccountProtectionStrongPasswords }
	// 		onChange={ toggleStrongPasswords }
	// 		disabled={ ! isFeatureAvailable || isToggling || isUpdating }
	// 	/>
	// );

	/**
	 * Render
	 */
	return (
		<AdminPage>
			<AdminSectionHero>
				<Container className={ styles.container } horizontalSpacing={ 8 } horizontalGap={ 4 }>
					<Col>
						<div className={ styles[ 'toggle-wrapper' ] }>
							{ accountProtectionSettings }
							{ supportsAdvancedOptions && (
								<>
									{ passwordDetectionSettings }
									{ strongPasswordsSettings }
								</>
							) }
						</div>
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default SettingsPage;
