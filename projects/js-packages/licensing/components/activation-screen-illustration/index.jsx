/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * The Activation Screen Illustration component.
 * @param {object} props -- The properties.
 * @param {string} props.imageUrl -- The assets base URL.
 * @returns {React.Component} The `ActivationScreenIllustration` component.
 */
const ActivationScreenIllustration = props => {
	const { imageUrl } = props;

	return (
		<div className="jp-license-activation-screen-illustration">
			<img src={imageUrl} alt="" />
			<p>{__('Do you need help? Contact us.', 'jetpack')}</p>
		</div>
	);
};

ActivationScreenIllustration.PropTypes = {
	imageUrl: PropTypes.String,
};

export default ActivationScreenIllustration;
