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

	actions = {
		reconnect: ( message, code ) => (
			<ErrorNoticeCycleConnection text={ message } errorCode={ code } action="reconnect" />
		),
		refresh_blog_token: ( message, code ) => (
			<ErrorNoticeCycleConnection text={ message } errorCode={ code } action="refresh_blog_token" />
		),
		refresh_user_token: ( message, code ) => (
			<ErrorNoticeCycleConnection text={ message } errorCode={ code } action="refresh_user_token" />
		),
	};

	isActionSupported( action ) {
		return (
			this.actions.hasOwnProperty( action ) &&
			{}.toString.call( this.actions[ action ] ) === '[object Function]'
		);
	}

	renderOne( error ) {
		if ( ! this.isActionSupported( error.action ) ) {
			return '';
		}

		return (
			<React.Fragment>{ this.actions[ error.action ]( error.message, error.code ) }</React.Fragment>
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

export default connect( null, null )( JetpackConnectionErrors );
