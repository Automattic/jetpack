/**
 * External dependencies
 */
import React from 'react';
import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Button, TextControl } from '@wordpress/components';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * The Activation Screen Controls component.
 * @param {object} props -- The properties.
 * @param {string} props.siteUrl
 * @param {string} props.license
 * @param {function} props.onLicenseChange
 * @param {function} props.submitLicense
 * @returns {React.Component} The `ActivationScreenControls` component.
 */
const ActivationScreenControls = props => {
	const { license, onLicenseChange, siteUrl } = props;

	return (
		<div className="jp-license-activation-screen-controls">
			<JetpackLogo showText={false} height={48} logoColor="#069E08" />
			<h1>{__('Activate a product', 'jetpack')}</h1>
			<p>
				{createInterpolateElement(
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
				)}
			</p>
			<TextControl
				className="jp-license-activation-screen-controls--license-field"
				label={__('License key', 'jetpack')}
				placeholder="jp-Product34623432423423"
				value={license}
				onChange={onLicenseChange}
			/>
			<Button className="jp-license-activation-screen-controls--button">
				{__('Activate', 'jetpack')}
			</Button>
		</div>
	);
};

ActivationScreenControls.PropTypes = {
	license: PropTypes.string.isRequired,
	siteUrl: PropTypes.string.isRequired,
	onLicenseChange: PropTypes.func.isRequired,
	licenseError: PropTypes.string,
	// submitLicense: PropTypes.func.isRequired,
};

export default ActivationScreenControls;
