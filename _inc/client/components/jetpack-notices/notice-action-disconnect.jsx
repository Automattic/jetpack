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
import { disconnectSite } from 'state/connection';
import analytics from 'lib/analytics';

class NoticeActionDisconnect extends React.Component {
	static propTypes = {
		icon: PropTypes.string,
	};

	handleDisconnectClick = () => {
		analytics.tracks.recordEvent( 'jetpack_termination_error_notice_click', {
			location: 'dashboard',
			purpose: 'reconnect',
		} );

		this.props.disconnectSite();
	};

	render() {
		return (
			<NoticeAction icon={ this.props.icon } onClick={ this.handleDisconnectClick }>
				{ this.props.children }
			</NoticeAction>
		);
	}
}

export default connect( null, dispatch => {
	return {
		disconnectSite: () => {
			return dispatch( disconnectSite( true ) );
		},
	};
} )( NoticeActionDisconnect );
