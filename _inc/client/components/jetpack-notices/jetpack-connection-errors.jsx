/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ErrorNoticeCycleConnection from './error-notice-cycle-connection';

class JetpackConnectionErrors extends React.Component {
	static propTypes = {
		errors: PropTypes.array.isRequired,
	};

	getAction( action, message, code ) {
		switch ( action ) {
			case 'reconnect':
			case 'refresh_blog_token':
			case 'refresh_user_token':
				return <ErrorNoticeCycleConnection text={ message } errorCode={ code } action={ action } />;
		}

		return null;
	}

	renderOne( error ) {
		const action = this.getAction( error.action, error.message, error.code );

		return null === action ? '' : <React.Fragment>{ action }</React.Fragment>;
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

export default connect( null, null )( JetpackConnectionErrors );
