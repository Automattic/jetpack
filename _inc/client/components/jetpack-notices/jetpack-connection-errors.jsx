/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NoticeActionDisconnect from './notice-action-disconnect';
import SimpleNotice from 'components/notice';

export class ErrorNoticeCycleConnection extends React.Component {
	static defaultProps = {
		text: __( 'Connection Error, please reconnect.', 'jetpack' ),
	};

	static propTypes = {
		text: PropTypes.string.isRequired,
		errorCode: PropTypes.string,
	};

	render() {
		return (
			<SimpleNotice
				showDismiss={ false }
				text={ this.props.text }
				status={ 'is-error' }
				icon={ 'link-break' }
			>
				<NoticeActionDisconnect errorCode={ this.props.errorCode }>
					{ __( 'Reconnect', 'jetpack' ) }
				</NoticeActionDisconnect>
			</SimpleNotice>
		);
	}
}

export default class JetpackConnectionErrors extends React.Component {
	static propTypes = {
		errors: PropTypes.array.isRequired,
	};

	actions = {
		reconnect: ( message, code ) => (
			<ErrorNoticeCycleConnection text={ message } errorCode={ code } />
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
