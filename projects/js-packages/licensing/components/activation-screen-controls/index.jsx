import jetpackAnalytics from '@automattic/jetpack-analytics';
import { JetpackLogo, Spinner } from '@automattic/jetpack-components';
import { Button, TextControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

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
	const { activateLicense, isActivating, license, licenseError, onLicenseChange } = props;

	const hasLicenseError = licenseError !== null && licenseError !== undefined;

	useEffect( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_license_key_activation_view' );
	}, [] );

	return (
		<div className="jp-license-activation-screen-controls">
			<div className="jp-license-activation-screen-controls--content">
				<JetpackLogo showText={ false } height={ 48 } />
				<h1>{ __( 'Add a license key', 'jetpack' ) }</h1>
				<p>
					{ createInterpolateElement(
						__(
							'<strong>Check your email</strong> for your license key. You should have received it after making your purchase.',
							'jetpack'
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
				>
					{ isActivating ? <Spinner /> : __( 'Activate', 'jetpack' ) }
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
