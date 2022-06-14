import SimpleNotice from 'components/notice/index.jsx';
import NoticeAction from 'components/notice/notice-action';
import debugModule from 'debug';
import notices from 'notices';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { removeNotice } from './state/notices/actions';

const debug = debugModule( 'calypso:notices' );

import './style.scss';

class NoticesList extends React.Component {
	static displayName = 'NoticesList';

	static propTypes = {
		id: PropTypes.string,
		notices: PropTypes.oneOfType( [ PropTypes.object, PropTypes.array ] ),
	};

	static defaultProps = {
		id: 'overlay-notices',
		notices: Object.freeze( [] ),
	};

	UNSAFE_componentWillMount() {
		debug( 'Mounting Global Notices React component.' );
	}

	removeNotice = notice => {
		if ( notice ) {
			notices.removeNotice( notice );
		}
	};

	handleLocalNoticeDismissClick = notice => {
		return () => this.removeNotice( notice );
	};

	handleReduxNoticeDismissClick = noticeId => {
		return () => this.props.removeNotice( noticeId );
	};

	render() {
		const noticesRaw = this.props.notices[ this.props.id ] || [];
		let noticesList = noticesRaw.map( function ( notice, index ) {
			return (
				<SimpleNotice
					key={ 'notice-old-' + index }
					status={ notice.status }
					duration={ notice.duration || null }
					text={ notice.text }
					isCompact={ notice.isCompact }
					onDismissClick={ this.handleLocalNoticeDismissClick( notice ) }
					showDismiss={ notice.showDismiss }
				>
					{ notice.button && (
						<NoticeAction href={ notice.href } onClick={ notice.onClick }>
							{ notice.button }
						</NoticeAction>
					) }
				</SimpleNotice>
			);
		}, this );

		//This is an interim solution for displaying both notices from redux store
		//and from the old component. When all notices are moved to redux store, this component
		//needs to be updated.
		noticesList = noticesList.concat(
			this.props.storeNotices.map( function ( notice, index ) {
				return (
					<SimpleNotice
						key={ 'notice-' + index }
						status={ notice.status }
						duration={ notice.duration || null }
						showDismiss={ notice.showDismiss }
						onDismissClick={ this.handleReduxNoticeDismissClick( notice.noticeId ) }
						text={ notice.text }
					/>
				);
			}, this )
		);

		if ( ! noticesList.length ) {
			return null;
		}

		return (
			<div id={ this.props.id } className="global-notices">
				{ noticesList }
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			storeNotices: state.globalNotices,
		};
	},
	dispatch => bindActionCreators( { removeNotice }, dispatch )
)( NoticesList );
