/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ErrorGridicon from './error-gridicon';
import './style.scss';

/**
 * Render the error message element.
 *
 * @param {string} errorMessage - The error message.
 * @returns {React.Component} The error message element.
 */
const renderErrorMessage = errorMessage => {
	return (
		<div className="jp-components-error-message--error-message">
			<ErrorGridicon />
			<span>{ errorMessage }</span>
		</div>
	);
};

/**
 * Higher order component to display the error message near the element.
 *
 * @param {React.Component} ComponentToWrap - The component that may display the error.
 * @returns {React.Component} The higher order component.
 */
const withErrorMessage = ComponentToWrap => {
	/**
	 * The `ComponentToWrap` with error message if needed.
	 *
	 * @param {object} props - The properties.
	 * @param {boolean} props.hasError - Whether the site has an error.
	 * @param {Function} props.errorMessage - The error message.
	 * @returns {React.Component} The higher order component.
	 */
	const WrappedComponent = props => {
		const { displayError, errorMessage } = props;

		if ( displayError ) {
			if ( ! props.hasOwnProperty( 'className' ) ) {
				props.className = '';
			}

			props.className += ' jp-components-error-message--has-error';
		}

		return (
			<>
				<ComponentToWrap { ...props } />

				{ displayError && renderErrorMessage( errorMessage ) }
			</>
		);
	};

	WrappedComponent.defaultProps = {
		errorMessage: __( 'An error occurred. Please try again.', 'jetpack' ),
		hasError: false,
	};

	WrappedComponent.propTypes = {
		/** The error message string */
		errorMessage: PropTypes.string,
		/** Whether to display the error message */
		displayError: PropTypes.bool,
	};

	return WrappedComponent;
};

export default withErrorMessage;
