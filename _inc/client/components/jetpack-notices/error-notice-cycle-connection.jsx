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
import NoticeActionDisconnect from './notice-action-disconnect';

export default class ErrorNoticeCycleConnection extends React.Component {
	static defaultProps = {
		text: __( 'Connection Error, please reconnect.' ),
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
					{ __( 'Reconnect' ) }
				</NoticeActionDisconnect>
			</SimpleNotice>
		);
	}
}
