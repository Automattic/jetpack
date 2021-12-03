/**
 * External dependencies
 */
import { Button, TextControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { JetpackLogo } from '@automattic/jetpack-components';
import { sprintf, __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { Icon, warning } from '@wordpress/icons';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * The Activation Screen Controls component.
 *
 * @param {object} props -- The properties.
 * @param {Function} props.activateLicense -- function to handle submitting a license
 * @param {boolean} props.isActivating -- should the controls be disabled
 * @param {string} props.license -- the license code to edit or submit
 * @param {?string} props.licenseError -- any error that occurred while activating a license
 * @param {Function} props.onLicenseChange -- function to handle changes to license
 * @param {string} props.siteUrl -- the url of the site
 * @returns {React.Component} The `ActivationScreenControls` component.
 */
const ActivationScreenControls = props => {
	const { activateLicense, isActivating, license, licenseError, onLicenseChange, siteUrl } = props;

	const hasLicenseError = licenseError !== null && licenseError !== undefined;

	return (
		<div className="jp-license-activation-screen-controls">
			<div className="jp-license-activation-screen-controls--content">
				<JetpackLogo showText={ false } height={ 48 } />
				<h1>{ __( 'Activate a product', 'jetpack' ) }</h1>
				<p>
					{ createInterpolateElement(
						sprintf(
							/* translators: "%s" is the url of the site i.e. hopeful-weevil.jurassic.ninja. */
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
				<TextControl
					className={
						! hasLicenseError
							? 'jp-license-activation-screen-controls--license-field'
							: 'jp-license-activation-screen-controls--license-field-with-error'
					}
					label={ __( 'License key', 'jetpack' ) }
					value={ license }
					onChange={ onLicenseChange }
					disabled={ isActivating }
				/>
				{ hasLicenseError && (
					<div className="jp-license-activation-screen-controls--license-field-error">
						<Icon icon={ warning } />
						<span>{ licenseError }</span>
					</div>
				) }
			</div>
			<div>
				<Button
					className="jp-license-activation-screen-controls--button"
					onClick={ activateLicense }
					disabled={ license.length <= 0 || isActivating }
					isBusy={ isActivating }
				>
					{ isActivating ? __( 'Working…', 'jetpack' ) : __( 'Activate', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

ActivationScreenControls.propTypes = {
	activateLicense: PropTypes.func.isRequired,
	isActivating: PropTypes.bool.isRequired,
	license: PropTypes.string.isRequired,
	licenseError: PropTypes.string,
	onLicenseChange: PropTypes.func.isRequired,
	siteUrl: PropTypes.string.isRequired,
};

export default ActivationScreenControls;
