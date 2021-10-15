/**
 * External dependencies
 */
import React from 'react';

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
 * @param {React.Component} WrappedComponent - The component that may display the error.
 * @returns {React.Component} The higher order component.
 */
const withErrorMessage = WrappedComponent => {
	/**
	 * The `WrappedComponent` with error message if needed.
	 *
	 * @param {object} props - The properties.
	 * @param {Function} props.errorMessage - The error message.
	 * @returns {React.Component} The higher order component.
	 */
	return props => {
		const { errorMessage } = props;
		const hasError = errorMessage !== null;

		if ( hasError ) {
			if ( ! props.hasOwnProperty( 'className' ) ) {
				props.className = '';
			}

			props.className += ' jp-components-error-message--has-error';
		}

		return (
			<>
				<WrappedComponent { ...props } />

				{ hasError && renderErrorMessage( errorMessage ) }
			</>
		);
	};
};

export default withErrorMessage;
