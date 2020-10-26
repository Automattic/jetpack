/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ErrorNoticeCycleConnection from './error-notice-cycle-connection';
import SimpleNotice from 'components/notice';

export default class JetpackConnectionErrors extends React.Component {
	static propTypes = {
		errors: PropTypes.array.isRequired,
	};

	getAction( action, message, code, errorData ) {
		switch ( action ) {
			case 'reconnect':
				return (
					<ErrorNoticeCycleConnection
						text={ message }
						errorCode={ code }
						errorData={ errorData }
						action={ action }
					/>
				);
			case 'display':
				return (
					<SimpleNotice
						text={ message }
						status={ 'is-error' }
						icon={ 'link-break' }
						showDismiss={ false }
					/>
				);
		}

		return null;
	}

	renderOne( error ) {
		const action = this.getAction(
			error.action,
			error.message,
			error.code,
			error.hasOwnProperty( 'data' ) ? error.data : {}
		);

		return null === action ? null : (
			<React.Fragment key={ error.action }>{ action }</React.Fragment>
		);
	}

	render() {
		const errorsToDisplay = {};
		const errors = this.props.errors.filter( error => error.hasOwnProperty( 'action' ) );

		for ( const error of errors ) {
			if ( ! errorsToDisplay.hasOwnProperty( error.action ) ) {
				errorsToDisplay[ error.action ] = error;
			}
		}

		return Object.values( errorsToDisplay ).map( error => this.renderOne( error ) );
	}
}
