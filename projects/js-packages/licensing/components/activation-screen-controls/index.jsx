/**
 * External dependencies
 */
import React from 'react';
import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Button, TextControl } from '@wordpress/components';
import PropTypes from 'prop-types';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * The Activation Screen Controls component.
 * @param {object} props -- The properties.
 * @param {string} props.siteUrl
 * @returns {React.Component} The `ActivationScreenControls` component.
 */
const ActivationScreenControls = props => {
	const { siteUrl } = props;

	return (
		<div className="jp-license-activation-screen-controls">
			<JetpackLogo showText={false} height={48} logoColor="#069E08" />
			<h1>{__('Activate a product', 'jetpack')}</h1>
			<p>
				{sprintf(
					__(
						'Enter the license key we sent to your email to activate your product for %s',
						'jetpack'
					),
					siteUrl
				)}
			</p>
			<TextControl
				className="jp-license-activation-screen-controls--license-field"
				label={__('License key', 'jetpack')}
				placeholder="jp-Product34623432423423"
			/>
			<Button className="jp-license-activation-screen-controls--button">
				{__('Continue', 'jetpack')}
			</Button>
		</div>
	);
};

ActivationScreenControls.PropTypes = {
	siteUrl: PropTypes.string,
};

export default ActivationScreenControls;
