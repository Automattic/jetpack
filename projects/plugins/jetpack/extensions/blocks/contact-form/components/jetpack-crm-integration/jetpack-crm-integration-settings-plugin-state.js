/**
 * External dependencies
 */
import semver from 'semver';

/**
 * WordPress dependencies
 */
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CRMJetpackFormsExtension from './jetpack-crm-integration-settings-extension';

export const pluginStateEnum = Object.freeze( {
	ACTIVE: 1,
	INSTALLED: 2,
	NOT_INSTALLED: 3,
} );

const CRMPluginNoVersion = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ __( 'The Jetpack CRM is installed but has an invalid version.', 'jetpack' ) }
		</p>
	);
};

const CRMPluginUpdate = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ __(
				'The Zero BS CRM plugin is now Jetpack CRM. Update to the latest version to integrate your contact form with your CRM.',
				'jetpack'
			) }
		</p>
	);
};

const CRMPluginIsNotInstalled = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ createInterpolateElement(
				__(
					'You can save contacts from Jetpack contact forms in Jetpack CRM. Learn more at <a>jetpackcrm.com</a>',
					'jetpack'
				),
				{
					a: <ExternalLink href="https://jetpackcrm.com" />,
				}
			) }
		</p>
	);
};

const CRMPluginIsInstalled = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ __(
				"You already have the Jetpack CRM plugin installed, but it's not activated. Activate the Jetpack CRM plugin to save contacts from this contact form in your Jetpack CRM.",
				'jetpack'
			) }
		</p>
	);
};

const CRMPluginIsActive = ( { crmData, setCRMData, jetpackCRM, setAttributes } ) => {
	const [ isActivatingExt, setIsActivatingExt ] = useState( false );
	const [ extActivationError, setExtActivationError ] = useState( false );

	if ( ! crmData.jp_form_ext_enabled ) {
		return (
			<CRMJetpackFormsExtension
				isActivatingExt={ isActivatingExt }
				setIsActivatingExt={ setIsActivatingExt }
				extActivationError={ extActivationError }
				setExtActivationError={ setExtActivationError }
				crmData={ crmData }
				setCRMData={ setCRMData }
			/>
		);
	}

	if ( semver.satisfies( semver.coerce( crmData.crm_version ), '3.0.19 - 4.0.0' ) ) {
		return (
			<p className="jetpack-contact-form__crm_text">
				{ __( 'Contacts from this form will be stored in Jetpack CRM.', 'jetpack' ) }
			</p>
		);
	}

	return (
		<ToggleControl
			className="jetpack-contact-form__crm_toggle"
			label={ __( 'Jetpack CRM', 'jetpack' ) }
			checked={ jetpackCRM }
			onChange={ value => setAttributes( { jetpackCRM: value } ) }
			help={ __( 'Store contact form submissions in your CRM.', 'jetpack' ) }
		/>
	);
};

const CRMPluginState = ( { crmData, setCRMData, jetpackCRM, setAttributes } ) => {
	const crmPluginVersion = semver.coerce( crmData.crm_version );

	if ( crmData.crm_installed && ! crmPluginVersion ) {
		// We can't tell which version of CRM is installed.
		return <CRMPluginNoVersion />;
	}

	if ( crmData.crm_installed && semver.lt( crmPluginVersion, '3.0.19' ) ) {
		// Old versions of Jetpack CRM can't use the form submission data.
		return <CRMPluginUpdate />;
	}

	let crmPluginState = pluginStateEnum.NOT_INSTALLED;

	if ( crmData.crm_active ) {
		crmPluginState = pluginStateEnum.ACTIVE;
	} else if ( crmData.crm_installed ) {
		crmPluginState = pluginStateEnum.INSTALLED;
	}

	return (
		<div aria-live="polite">
			{ pluginStateEnum.ACTIVE === crmPluginState && (
				<CRMPluginIsActive
					crmData={ crmData }
					setCRMData={ setCRMData }
					jetpackCRM={ jetpackCRM }
					setAttributes={ setAttributes }
				/>
			) }

			{ pluginStateEnum.INSTALLED === crmPluginState && <CRMPluginIsInstalled /> }

			{ pluginStateEnum.NOT_INSTALLED === crmPluginState && <CRMPluginIsNotInstalled /> }
		</div>
	);
};

export default CRMPluginState;
