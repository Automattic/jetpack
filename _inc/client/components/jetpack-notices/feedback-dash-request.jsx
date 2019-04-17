/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';

/**
 * Internal dependencies
 */
import {
	isNoticeDismissed as _isNoticeDismissed,
	dismissJetpackNotice,
} from 'state/jetpack-notices';
import { JETPACK_CONTACT_SUPPORT } from 'constants/urls';

class FeedbackDashRequest extends React.Component {
	static displayName = 'FeedbackDashRequest';

	renderContent = () => {
		if ( this.props.isDismissed( 'feedback_dash_request' ) ) {
			return;
		}

		return (
			<div>
				<SimpleNotice
					className="jp-dash-item__feedback-request"
					status="is-basic"
					onDismissClick={ this.props.dismissNotice }
					text={ __( 'What would you like to see on your Jetpack Dashboard?' ) }
				>
					<NoticeAction href={ JETPACK_CONTACT_SUPPORT }>{ __( 'Let us know!' ) }</NoticeAction>
				</SimpleNotice>
			</div>
		);
	};

	render() {
		return <div>{ this.renderContent() }</div>;
	}
}

export default connect(
	state => {
		return {
			isDismissed: notice => _isNoticeDismissed( state, notice ),
		};
	},
	dispatch => {
		return {
			dismissNotice: () => {
				return dispatch( dismissJetpackNotice( 'feedback_dash_request' ) );
			},
		};
	}
)( FeedbackDashRequest );
