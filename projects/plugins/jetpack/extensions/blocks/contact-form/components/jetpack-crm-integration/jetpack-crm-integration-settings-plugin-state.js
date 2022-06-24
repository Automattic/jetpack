import { Button, Icon, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import semver from 'semver';
import { installAndActivatePlugin, activatePlugin } from '../../../../shared/plugin-management';
import CRMJetpackFormsExtension from './jetpack-crm-integration-settings-extension';

const pluginPathWithoutPhp = 'zero-bs-crm/ZeroBSCRM';
const pluginSlug = 'zero-bs-crm';

export const pluginStateEnum = Object.freeze( {
	ACTIVE: 1,
	INSTALLED: 2,
	NOT_INSTALLED: 3,
} );

const CRMPluginNoVersion = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ __( 'The Jetpack CRM plugin is installed but has an invalid version.', 'jetpack' ) }
		</p>
	);
};

const CRMPluginUpdate = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ __(
				'Please update to the latest version of the Jetpack CRM plugin to integrate your contact form with your CRM.',
				'jetpack'
			) }
		</p>
	);
};

const CRMPluginIsInstalling = ( { isActivating } ) => {
	const btnTxt = isActivating
		? __( 'Activating…', 'jetpack' )
		: __( 'Installing…', 'jetpack', /* dummy arg to avoid bad minification */ 0 );
	return (
		<Button
			variant="secondary"
			icon={ <Icon style={ { animation: 'rotation 2s infinite linear' } } icon="update" /> }
			disabled
			aria-label={ btnTxt }
		>
			{ btnTxt }
		</Button>
	);
};

const CRMPluginIsNotInstalled = ( { installAndActivateCRMPlugin, isInstalling } ) => {
	let button = (
		<Button variant="secondary" onClick={ installAndActivateCRMPlugin }>
			{ __( 'Install Jetpack CRM', 'jetpack' ) }
		</Button>
	);

	if ( isInstalling ) {
		button = <CRMPluginIsInstalling />;
	}

	return (
		<p className="jetpack-contact-form__crm_text jetpack-contact-form__integration-panel">
			<em style={ { color: 'rgba(38, 46, 57, 0.7)' } }>
				{ __( 'You can save contacts from Jetpack contact forms in Jetpack CRM.', 'jetpack' ) }
				<br />
				{ button }
			</em>
		</p>
	);
};

const CRMPluginIsInstalled = ( { activateCRMPlugin, isInstalling } ) => {
	return (
		<p className="jetpack-contact-form__crm_text jetpack-contact-form__integration-panel">
			<em>
				{ __(
					'You already have the Jetpack CRM plugin installed, but it’s not activated.',
					'jetpack'
				) }
			</em>
			<br />
			{ isInstalling && <CRMPluginIsInstalling isActivating /> }
			{ ! isInstalling && (
				<Button variant="secondary" onClick={ activateCRMPlugin }>
					{ __( 'Activate the Jetpack CRM plugin', 'jetpack' ) }
				</Button>
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

const CRMPluginState = ( {
	crmData,
	setCRMData,
	jetpackCRM,
	setAttributes,
	onCRMPluginClick,
	isInstalling,
} ) => {
	const crmPluginVersion = semver.coerce( crmData.crm_version );

	if ( crmData.crm_installed && ! crmPluginVersion ) {
		// We can't tell which version of CRM is installed.
		return <CRMPluginNoVersion />;
	}

	if ( crmData.crm_installed && semver.lt( crmPluginVersion, '4.9.1' ) ) {
		// Old versions of Jetpack CRM can't use the form submission data,
		// or include a welcome wizard that can get in the way.
		// @see https://github.com/Automattic/jetpack/pull/23618#issuecomment-1079430205
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

			{ pluginStateEnum.INSTALLED === crmPluginState && (
				<CRMPluginIsInstalled
					activateCRMPlugin={ () => onCRMPluginClick( activatePlugin, pluginPathWithoutPhp ) }
					isInstalling={ isInstalling }
				/>
			) }

			{ pluginStateEnum.NOT_INSTALLED === crmPluginState && (
				<CRMPluginIsNotInstalled
					installAndActivateCRMPlugin={ () =>
						onCRMPluginClick( installAndActivatePlugin, pluginSlug )
					}
					isInstalling={ isInstalling }
				/>
			) }
		</div>
	);
};

export default CRMPluginState;
