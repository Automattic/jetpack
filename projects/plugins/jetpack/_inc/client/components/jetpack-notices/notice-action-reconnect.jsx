import NoticeAction from 'components/notice/notice-action';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { reconnectSite, isReconnectingSite } from 'state/connection';

class NoticeActionReconnect extends React.Component {
	static propTypes = {
		icon: PropTypes.string,
		errorCode: PropTypes.string,
		errorData: PropTypes.object,
		action: PropTypes.string,
	};

	getEventProps = () => {
		const eventProps = {
			location: 'dashboard',
			purpose: 'reconnect',
		};

		if ( this.props.errorCode ) {
			eventProps.error_code = this.props.errorCode;
		}

		if ( this.props.errorData ) {
			if ( this.props.errorData.api_error_code ) {
				eventProps.api_error_code = this.props.errorData.api_error_code;
			}
			if ( this.props.errorData.api_http_code ) {
				eventProps.api_http_code = this.props.errorData.api_http_code;
			}
		}

		return eventProps;
	};

	handleDisconnectClick = () => {
		// Reconnection already in progress
		if ( this.props.isReconnectingSite ) {
			return;
		}

		analytics.tracks.recordEvent( 'jetpack_termination_error_notice_click', this.getEventProps() );
		this.props.reconnectSite( this.props.action );
	};

	componentDidMount() {
		analytics.tracks.recordEvent( 'jetpack_termination_error_notice_view', this.getEventProps() );
	}

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
			reconnectSite: () => {
				return dispatch( reconnectSite() );
			},
		};
	}
)( NoticeActionReconnect );
