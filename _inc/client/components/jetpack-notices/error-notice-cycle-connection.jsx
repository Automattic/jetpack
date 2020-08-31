/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */

import SimpleNotice from 'components/notice';
import NoticeActionReconnect from './notice-action-reconnect';

export default class ErrorNoticeCycleConnection extends React.Component {
	static defaultProps = {
		text: __( 'Connection Error, please reconnect.', 'jetpack' ),
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
					{ __( 'Restore Connection', 'jetpack' ) }
				</NoticeActionReconnect>
			</SimpleNotice>
		);
	}
}
