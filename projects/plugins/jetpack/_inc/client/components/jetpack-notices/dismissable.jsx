import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
	isNoticeDismissed as _isNoticeDismissed,
	getJetpackNotices as _getJetpackNotices,
	dismissJetpackActionNotice,
} from 'state/jetpack-notices';

class DismissableNotices extends React.Component {
	static displayName = 'DismissableNotices';

	dismissJetpackActionNotice = () => {
		this.props.dismissJetpackActionNotice( this.props.jetpackNotices );
	};

	renderNotices = () => {
		const notices = this.props.jetpackNotices;

		switch ( notices ) {
			default:
				return false;
		}
	};

	render() {
		return <div>{ this.renderNotices() }</div>;
	}
}

export default connect(
	state => {
		return {
			jetpackNotices: _getJetpackNotices( state ),
			isDismissed: notice => _isNoticeDismissed( state, notice ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				dismissJetpackActionNotice,
			},
			dispatch
		);
	}
)( DismissableNotices );
