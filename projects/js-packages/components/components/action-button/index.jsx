/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
/**
 * Internal dependencies
 */
import React from 'react';
import Button from '../button';
import styles from './style.module.scss';

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
	const { label, onClick, isLoading, displayError, errorMessage } = props;

	return (
		<>
			{
				<Button
					className={ classNames( styles.button, 'jp-action-button--button' ) }
					label={ label }
					onClick={ onClick }
					variant="primary"
					disabled={ isLoading }
				>
					{ isLoading ? <Spinner /> : label }
				</Button>
			}

			{ displayError && (
				<p className={ classNames( styles.error, 'jp-action-button__error' ) }>{ errorMessage }</p>
			) }
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
	/** Displays an error message */
	displayError: PropTypes.bool,
	/** The error message string */
	errorMessage: PropTypes.string,
};

ActionButton.defaultProps = {
	isLoading: false,
	displayError: false,
	errorMessage: __( 'An error occurred. Please try again.', 'jetpack' ),
};

export default ActionButton;
