/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { Button } from '@automattic/jetpack-components';
import './style.scss';

const ConnectButton = props => {
	const buttonProps = {
		className: 'jp-jetpack-connect__button',
		href: props.connectUrl,
		disabled: props.disabled,
		onClick: props.onClick,
	};

	return props.asLink ? (
		<a { ...buttonProps }>{ props.label }</a>
	) : (
		<Button { ...buttonProps }>{ props.label }</Button>
	);
};

ConnectButton.propTypes = {
	disabled: PropTypes.bool,
	asLink: PropTypes.bool,
	connectUrl: PropTypes.string.required,
	label: PropTypes.string,
	onClick: PropTypes.func,
};

ConnectButton.defaultProps = {
	disabled: false,
	asLink: false,
	label: __( 'Set up Jetpack', 'jetpack' ),
	onClick: () => {},
};

export default ConnectButton;
