import { getJetpackStateNotice } from '@automattic/jetpack-my-jetpack/components/jetpack-state-notice/index.tsx';
import { Component } from 'react';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import { getCurrentVersion } from 'state/initial-state';
import {
	getJetpackStateNoticesErrorCode,
	getJetpackStateNoticesMessageCode,
	getJetpackStateNoticesErrorDescription,
} from 'state/jetpack-notices';

class JetpackStateNotices extends Component {
	static displayName = 'JetpackStateNotices';
	state = { showNotice: true };

	/**
	 * Only need to hide.  They will not appear on next page load.
	 */
	dismissJetpackStateNotice = () => {
		this.setState( { showNotice: false } );
	};

	render() {
		if ( ! this.state.showNotice ) {
			return null;
		}

		const notice = getJetpackStateNotice(
			{
				error: this.props.jetpackStateNoticesErrorCode,
				errorDescription: this.props.jetpackStateNoticesErrorDescription,
				message: this.props.jetpackStateNoticesMessageCode,
			},
			{ jetpackVersion: this.props.currentVersion, showUnknownMessages: true }
		);

		if ( ! notice ) {
			return null;
		}

		return (
			<SimpleNotice
				status={ `is-${ notice.level }` }
				onDismissClick={ this.dismissJetpackStateNotice }
				text={ notice.content }
			>
				{ notice.action && (
					<NoticeAction href={ notice.action.href }>{ notice.action.label }</NoticeAction>
				) }
			</SimpleNotice>
		);
	}
}

export default connect( state => {
	return {
		currentVersion: getCurrentVersion( state ),
		jetpackStateNoticesErrorCode: getJetpackStateNoticesErrorCode( state ),
		jetpackStateNoticesMessageCode: getJetpackStateNoticesMessageCode( state ),
		jetpackStateNoticesErrorDescription: getJetpackStateNoticesErrorDescription( state ),
	};
} )( JetpackStateNotices );
