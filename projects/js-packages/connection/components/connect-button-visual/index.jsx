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
 * The RNA connection component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.connectLabel -- The "Connect" button label.
 * @param {Function} props.onButtonClick -- The callback to be called click.
 * @param {object} props.connectionStatus -- The connection status object.
 * @param {boolean} props.connectionStatusIsFetching -- The flag indicating that connection status is being fetched.
 * @param {boolean} props.isRegistering -- The flag indicating that registration is being processed.
 * @param {boolean} props.registationError -- The flag indicating that registration failed.
 * @returns {React.Component} The RNA connection component.
 */
const ConnectButtonVisual = props => {
	const {
		connectLabel,
		onButtonClick,
		connectionStatus,
		connectionStatusIsFetching,
		isRegistering,
		registationError,
	} = props;

	return (
		<div className="jp-connect-button">
			{ connectionStatusIsFetching && `Loading...` }

			{ ( ! connectionStatus.isRegistered || ! connectionStatus.isUserConnected ) &&
				! connectionStatusIsFetching && (
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
	connectLabel: PropTypes.string,
	onButtonClick: PropTypes.func,
};

ConnectButtonVisual.defaultProps = {
	connectLabel: __( 'Connect', 'jetpack' ),
};

export default ConnectButtonVisual;
