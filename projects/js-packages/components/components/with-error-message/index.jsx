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
 * @param {string} displayName - Custom name for the wrapped component, optional.
 * @returns {React.Component} The higher order component.
 */
const withErrorMessage = ( ComponentToWrap, displayName ) => {
	/**
	 * The `ComponentToWrap` with error message if needed.
	 *
	 * @param {object} props - The properties.
	 * @param {boolean} props.hasError - Whether the site has an error.
	 * @param {Function} props.errorMessage - The error message.
	 * @returns {React.Component} The higher order component.
	 */
	const WrappedComponent = props => {
		const { displayError, errorMessage, className } = props;
		const componentProps = Object.assign( {}, props );

		delete componentProps.displayError;
		delete componentProps.errorMessage;
		delete componentProps.className;

		return (
			<>
				<ComponentToWrap
					{ ...componentProps }
					className={
						className + ( displayError ? ' jp-components-error-message--has-error' : '' )
					}
				/>

				{ displayError && renderErrorMessage( errorMessage ) }
			</>
		);
	};

	WrappedComponent.displayName =
		displayName || `withErrorMessage(${ ComponentToWrap.displayName })`;

	WrappedComponent.defaultProps = {
		errorMessage: __( 'An error occurred. Please try again.', 'jetpack' ),
		displayError: false,
		className: '',
	};

	WrappedComponent.propTypes = {
		/** The error message string */
		errorMessage: PropTypes.string,
		/** Whether to display the error message */
		displayError: PropTypes.bool,
		/** Custom CSS class names */
		className: PropTypes.string,
	};

	return WrappedComponent;
};

export default withErrorMessage;
