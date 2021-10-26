/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, TextControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { JetpackLogo, withErrorMessage } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Style dependencies
 */
import './style.scss';

const TextControlWithErrorMessage = withErrorMessage( TextControl );

/**
 * The Activation Screen Controls component.
 * @param {object} props -- The properties.
 * @param {string} props.siteUrl
 * @param {string} props.license
 * @param {?string} props.licenseError
 * @param {function} props.onLicenseChange
 * @param {function} props.activateLicense
 * @param {boolean} props.disabled
 * @returns {React.Component} The `ActivationScreenControls` component.
 */
const ActivationScreenControls = props => {
	const { activateLicense, isSaving, license, licenseError, onLicenseChange, siteUrl } = props;
	return (
		<div className="jp-license-activation-screen-controls">
			<div className="jp-license-activation-screen-controls--content">
				<JetpackLogo showText={ false } height={ 48 } logoColor="#069E08" />
				<h1>{ __( 'Activate a product', 'jetpack' ) }</h1>
				<p>
					{ createInterpolateElement(
						sprintf(
							/* translators: "%s" is the url of the site i.e. hopeful-weevil.jurassic.ninja . */
							__(
								'Enter the license key we sent to your email to activate your product for <strong>%s</strong>',
								'jetpack'
							),
							siteUrl
						),
						{
							strong: <strong></strong>,
						}
					) }
				</p>
				<TextControlWithErrorMessage
					className="jp-license-activation-screen-controls--license-field"
					label={ __( 'License key', 'jetpack' ) }
					placeholder="jp-Product34623432423423"
					value={ license }
					onChange={ onLicenseChange }
					disabled={ isSaving }
					errorMessage={ licenseError }
				/>
			</div>
			<div>
				<Button
					className="jp-license-activation-screen-controls--button"
					onClick={ activateLicense }
					disabled={ license.length <= 0 || isSaving }
				>
					{ __( 'Activate', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

ActivationScreenControls.PropTypes = {
	activateLicense: PropTypes.func.isRequired,
	license: PropTypes.string.isRequired,
	licenseError: PropTypes.string,
	onLicenseChange: PropTypes.func.isRequired,
	siteUrl: PropTypes.string.isRequired,
};

export default ActivationScreenControls;
