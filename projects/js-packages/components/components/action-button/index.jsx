/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';
import Spinner from '../spinner';

/**
 * The Jetpack Action button.
 *
 * This component extends the regular `Button` component and adds a `isLoading` prop that will disable and display a spinner, giving the user the feedback that some action is happening. It also provides a generic error message.
 *
 * It is useful to async actions when the user has to wait the result of a request or process.
 */
const ActionButton = props => {
	const { label, onClick, isLoading, displayError, errorMessage } = props;

	return (
		<div className="jp-connect-button">
			{
				<Button
					className="jp-connect-button--button"
					label={ label }
					onClick={ onClick }
					isPrimary
					disabled={ isLoading }
				>
					{ isLoading ? <Spinner /> : label }
				</Button>
			}

			{ displayError && <p className="jp-connect-button__error">{ errorMessage }</p> }
		</div>
	);
};

ActionButton.propTypes = {
	/** The button label. */
	label: PropTypes.string,
	/** The callback to be called on click. */
	onClick: PropTypes.func,
	/** Will disable the button and display a spinner if set to true. */
	isLoading: PropTypes.bool,
	/** Displays an error message */
	displayError: PropTypes.bool,
	/** The error message string */
	errorMessage: PropTypes.string,
};

ActionButton.defaultProps = {
	label: 'Action!',
	isLoading: false,
	displayError: false,
	errorMessage: __( 'An error occurred. Please try again.', 'jetpack' ),
};

export default ActionButton;
