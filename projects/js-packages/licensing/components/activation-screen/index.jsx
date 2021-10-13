/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * The Activation Screen component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.assetBaseUrl -- The assets base URL.
 * @returns {React.Component} The `ActivationScreen` component.
 */
const ActivationScreen = props => {
	const { assetBaseUrl } = props;

	return <div>'hullo'</div>;
};

ActivationScreen.propTypes = {
	assetBaseUrl: PropTypes.string,
};

export default ActivationScreen;
