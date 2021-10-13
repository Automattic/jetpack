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
	const { connectLabel, onClick, isLoading, displayError } = props;

	return (
		<div className="jp-connect-button">
			{
				<Button
					className="jp-connect-button--button"
					label={ connectLabel }
					onClick={ onClick }
					isPrimary
					disabled={ isLoading }
				>
					{ isLoading ? <Spinner /> : connectLabel }
				</Button>
			}

			{ displayError && (
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
	onClick: PropTypes.func,
	/** Will disable the button and display a spinner if set to true. */
	isLoading: PropTypes.bool,
	/** Displays an error message */
	displayError: PropTypes.bool,
};

ConnectButtonVisual.defaultProps = {
	connectLabel: __( 'Connect', 'jetpack' ),
	isLoading: false,
	displayError: false,
};

export default ConnectButtonVisual;
