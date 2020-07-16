/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import NoticeAction from 'components/notice/notice-action';
import { reconnectSite, isReconnectingSite } from 'state/connection';
import analytics from 'lib/analytics';

class NoticeActionReconnect extends React.Component {
	static propTypes = {
		icon: PropTypes.string,
		errorCode: PropTypes.string,
		action: PropTypes.string,
	};

	handleDisconnectClick = () => {
		// Reconnection already in progress
		if ( this.props.isReconnectingSite ) {
			return;
		}
		const eventProps = {
			location: 'dashboard',
			purpose: 'reconnect',
		};

		if ( this.props.errorCode ) {
			eventProps.error_code = this.props.errorCode;
		}

		analytics.tracks.recordEvent( 'jetpack_termination_error_notice_click', eventProps );

		this.props.reconnectSite( this.props.action );
	};

	render() {
		return (
			<NoticeAction icon={ this.props.icon } onClick={ this.handleDisconnectClick }>
				{ this.props.children }
			</NoticeAction>
		);
	}
}

export default connect(
	state => {
		return {
			isReconnectingSite: isReconnectingSite( state ),
		};
	},
	dispatch => {
		return {
			reconnectSite: action => dispatch( reconnectSite( action ) ),
		};
	}
)( NoticeActionReconnect );
