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
 * Return `variant` CSS classes.
 * Polyfill for versions of `@wordpress/components` < 14.2.0.
 * To be removed once WordPress updates its dependencies.
 *
 * @param {string} variant - The button variant.
 * @returns {string} - The appropriate class name.
 */
const variantPolyfill = variant => {
	switch ( variant ) {
		case 'primary':
			return 'is-primary';
		case 'secondary':
			return 'is-secondary';
		case 'tertiary':
			return 'is-tertiary';
		case 'link':
			return 'is-link';
	}

	return '';
};

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
	const { label, onClick, isLoading, displayError, errorMessage, variant } = props;

	return (
		<div className="jp-action-button">
			{
				<Button
					className={ 'jp-action-button--button ' + variantPolyfill( variant ) }
					label={ label }
					onClick={ onClick }
					variant={ variant }
					disabled={ isLoading }
				>
					{ isLoading ? <Spinner /> : label }
				</Button>
			}

			{ displayError && <p className="jp-action-button__error">{ errorMessage }</p> }
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
	/** The button variant (primary, secondary, tertiary, link) */
	variant: PropTypes.string.isRequired,
};

ActionButton.defaultProps = {
	isLoading: false,
	displayError: false,
	errorMessage: __( 'An error occurred. Please try again.', 'jetpack' ),
	variant: 'primary',
};

export default ActionButton;
