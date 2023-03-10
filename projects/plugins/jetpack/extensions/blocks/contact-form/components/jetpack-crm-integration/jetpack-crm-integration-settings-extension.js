import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ExtensionActivationErrorState from './jetpack-crm-integration-settings-extension-error-state';

const useOnExtensionActivationClick = (
	setIsActivatingExt,
	setExtActivationError,
	crmData,
	setCRMData
) => {
	return () => {
		setExtActivationError( undefined );
		setIsActivatingExt( true );

		apiFetch( {
			path: '/jetpack/v4/jetpack_crm',
			method: 'POST',
			data: { extension: 'jetpackforms' },
		} )
			.then( result => {
				if ( 'success' !== result.code ) {
					throw new Error( result.code );
				}
				const newCRMData = Object.assign( {}, crmData );
				newCRMData.jp_form_ext_enabled = true;
				setCRMData( newCRMData );
			} )
			.catch( error => {
				setExtActivationError( error.message );
			} )
			.finally( () => {
				setIsActivatingExt( false );
			} );
	};
};

const CRMJetpackFormsExtensionActivation = ( {
	isActivatingExt,
	setIsActivatingExt,
	extActivationError,
	setExtActivationError,
	crmData,
	setCRMData,
} ) => {
	const onExtensionActivationClick = useOnExtensionActivationClick(
		setIsActivatingExt,
		setExtActivationError,
		crmData,
		setCRMData
	);

	if ( isActivatingExt ) {
		return <Spinner />;
	}

	if ( extActivationError ) {
		return <ExtensionActivationErrorState error={ extActivationError } />;
	}

	return (
		<Button variant="secondary" onClick={ onExtensionActivationClick }>
			{ __( 'Enable Jetpack Forms Extension', 'jetpack' ) }
		</Button>
	);
};

const CRMJetpackFormsExtensionNonAdminUser = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ __( 'A site administrator must enable the CRM Jetpack Forms extension.', 'jetpack' ) }
		</p>
	);
};

const CRMJetpackFormsExtensionActivateText = () => {
	return (
		<p className="jetpack-contact-form__crm_text">
			{ __(
				"You can integrate this contact form with Jetpack CRM by enabling Jetpack CRM's Jetpack Forms extension.",
				'jetpack'
			) }
		</p>
	);
};

const CRMJetpackFormsExtension = ( {
	isActivatingExt,
	setIsActivatingExt,
	extActivationError,
	setExtActivationError,
	crmData,
	setCRMData,
} ) => {
	if ( ! crmData.can_activate_extension ) {
		return <CRMJetpackFormsExtensionNonAdminUser />;
	}

	return (
		<div>
			<CRMJetpackFormsExtensionActivateText />

			<br />

			<CRMJetpackFormsExtensionActivation
				isActivatingExt={ isActivatingExt }
				setIsActivatingExt={ setIsActivatingExt }
				extActivationError={ extActivationError }
				setExtActivationError={ setExtActivationError }
				crmData={ crmData }
				setCRMData={ setCRMData }
			/>
		</div>
	);
};

export default CRMJetpackFormsExtension;
