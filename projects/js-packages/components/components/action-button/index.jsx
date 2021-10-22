/**
 * External dependencies
 */
import React from 'react';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';
import Spinner from '../spinner';
import { useErrorMessage } from '../with-error-message';

/**
 * The Jetpack Action button.
 *
 * This component extends the regular `Button` component and adds a `isLoading` prop that will disable and display a spinner, giving the user the feedback that some action is happening. It also provides a generic error message.
 *
 * It is useful to async actions when the user has to wait the result of a request or process.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ActionButton` component.
 */
const ActionButton = props => {
	const { label, onClick, isLoading, className, displayError, errorMessage } = props;

	const [ errorClassName, errorMessageElement ] = useErrorMessage( displayError, errorMessage );

	return (
		<>
			<Button
				className={ 'jp-action-button--button ' + className + ' ' + errorClassName }
				label={ label }
				onClick={ onClick }
				isPrimary
				disabled={ isLoading }
			>
				{ isLoading ? <Spinner /> : label }
			</Button>

			{ errorMessageElement }
		</>
	);
};

ActionButton.propTypes = {
	/** The button label. */
	label: PropTypes.string.isRequired,
	/** The callback to be called on click. */
	onClick: PropTypes.func,
	/** Will disable the button and display a spinner if set to true. */
	isLoading: PropTypes.bool,
	/** Button custom CSS class names */
	className: PropTypes.string,
	/** Whether to display the error message */
	displayError: PropTypes.bool,
	/** The error message string */
	errorMessage: PropTypes.string,
};

ActionButton.defaultProps = {
	isLoading: false,
	className: '',
};

export default ActionButton;
