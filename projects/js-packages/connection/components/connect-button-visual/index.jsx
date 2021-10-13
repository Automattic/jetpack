/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';
import { Spinner } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The Jetpack Connect button.
 *
 * This button is part of the Jetpack Connection package and implements the button used to establish a Jetpack connection.
 */
const ConnectButtonVisual = props => {
	const {
		connectLabel,
		onButtonClick,
		isRegistered,
		isUserConnected,
		connectionStatusIsFetching,
		isRegistering,
		registationError,
	} = props;

	return (
		<div className="jp-connect-button">
			{ connectionStatusIsFetching && `Loading...` }

			{ ( ! isRegistered || ! isUserConnected ) && ! connectionStatusIsFetching && (
				<Button
					className="jp-connect-button--button"
					label={ connectLabel }
					onClick={ onButtonClick }
					isPrimary
					disabled={ isRegistering }
				>
					{ isRegistering ? <Spinner /> : connectLabel }
				</Button>
			) }

			{ registationError && (
				<p className="jp-connect-button__error">
					{ __( 'An error occurred. Please try again.', 'jetpack' ) }
				</p>
			) }
		</div>
	);
};

ConnectButtonVisual.propTypes = {
	/** The "Connect" button label. */
	connectLabel: PropTypes.string,
	/** The callback to be called on click. */
	onButtonClick: PropTypes.func,
	/** Whether the site is already registered. */
	isRegistered: PropTypes.bool,
	/** Whether the current user is connected. */
	isUserConnected: PropTypes.bool,
	/** The flag indicating that connection status is being fetched. */
	connectionStatusIsFetching: PropTypes.bool,
	/** The flag indicating that registration is being processed. */
	isRegistering: PropTypes.bool,
	/** The flag indicating that registration failed. */
	registationError: PropTypes.bool,
};

ConnectButtonVisual.defaultProps = {
	connectLabel: __( 'Connect', 'jetpack' ),
	isRegistered: false,
	isUserConnected: false,
	connectionStatusIsFetching: false,
	isRegistering: false,
	registationError: false,
};

export default ConnectButtonVisual;
