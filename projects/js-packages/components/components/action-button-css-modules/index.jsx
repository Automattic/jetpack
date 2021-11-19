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
import styles from './style.module.scss';
import Spinner from '../spinner';

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
	const { label, onClick, isLoading, displayError, errorMessage, size } = props;

	const buttonClassName = `
		${ styles.button }
		${ size === 'small' ? styles.small : '' }
		${ size === 'medium' ? styles.medium : '' }
		${ size === 'large' ? styles.large : '' }
	`;

	return (
		<div>
			{
				<Button
					className={ buttonClassName }
					label={ label }
					onClick={ onClick }
					isPrimary
					disabled={ isLoading }
				>
					{ isLoading ? <Spinner /> : label }
				</Button>
			}

			{ displayError && <p className={ styles.error }>{ errorMessage }</p> }
		</div>
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
	/** The button size */
	size: PropTypes.oneOf( [ 'small', 'medium', 'large' ] ),
};

ActionButton.defaultProps = {
	isLoading: false,
	displayError: false,
	errorMessage: __( 'An error occurred. Please try again.', 'jetpack' ),
	size: 'medium',
};

export default ActionButton;
