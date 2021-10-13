/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { getRedirectUrl } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * The Activation Screen Illustration component.
 * @param {object} props -- The properties.
 * @param {string} props.imageUrl -- The assets base URL.
 * @param {boolean} props.showSupportLink -- The assets base URL.
 * @returns {React.Component} The `ActivationScreenIllustration` component.
 */
const ActivationScreenIllustration = ({ imageUrl, showSupportLink = false }) => (
	<div className="jp-license-activation-screen-illustration">
		<img src={imageUrl} alt="" />
		{showSupportLink && (
			<p>
				{createInterpolateElement(__('Do you need help? <a>Contact us.</a>', 'jetpack'), {
					a: <a href={getRedirectUrl('jetpack-support')} />,
				})}
			</p>
		)}
	</div>
);

ActivationScreenIllustration.PropTypes = {
	imageUrl: PropTypes.String,
};

export default ActivationScreenIllustration;
