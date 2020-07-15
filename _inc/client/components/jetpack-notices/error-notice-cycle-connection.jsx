/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */

import SimpleNotice from 'components/notice';
import NoticeActionReconnect from './notice-action-reconnect';

export default class ErrorNoticeCycleConnection extends React.Component {
	static defaultProps = {
		text: __( 'Connection Error, please reconnect.' ),
	};

	static propTypes = {
		text: PropTypes.string.isRequired,
		errorCode: PropTypes.string,
		action: PropTypes.string,
	};

	render() {
		return (
			<SimpleNotice
				showDismiss={ false }
				text={ this.props.text }
				status={ 'is-error' }
				icon={ 'link-break' }
			>
				<NoticeActionReconnect errorCode={ this.props.errorCode } action={ this.props.action }>
					{ __( 'Reconnect' ) }
				</NoticeActionReconnect>
			</SimpleNotice>
		);
	}
}
