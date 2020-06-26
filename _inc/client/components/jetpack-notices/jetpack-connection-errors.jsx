/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { getConnectionErrors } from 'state/initial-state';
import SimpleNotice from 'components/notice';
import NoticeActionDisconnect from './notice-action-disconnect';

export class ErrorNoticeCycleConnection extends React.Component {
	static defaultProps = {
		text: __( 'Connection Error, please reconnect.' ),
	};

	static propTypes = {
		text: PropTypes.string.isRequired,
	};

	render() {
		return (
			<SimpleNotice
				showDismiss={ false }
				text={ this.props.text }
				status={ 'is-error' }
				icon={ 'link-break' }
			>
				<NoticeActionDisconnect>{ __( 'Reconnect' ) }</NoticeActionDisconnect>
			</SimpleNotice>
		);
	}
}

class JetpackConnectionErrors extends React.Component {
	static propTypes = {
		errors: PropTypes.array.isRequired,
	};

	actions = {
		reconnect: message => <ErrorNoticeCycleConnection text={ message } />,
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
			<React.Fragment>
				{ this.actions[ error.action ]( error.message, error.code ) }{ ' ' }
			</React.Fragment>
		);
	}

	render() {
		return this.props.errors.map( error => this.renderOne( error ) );
	}
}

export default connect( state => {
	return {
		errors: getConnectionErrors( state ),
	};
} )( JetpackConnectionErrors );
