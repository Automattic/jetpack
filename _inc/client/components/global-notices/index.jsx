/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import debugModule from 'debug';

/**
 * Internal Dependencies
 */
import SimpleNotice from 'components/notice/index.jsx';
import NoticeAction from 'components/notice/notice-action';
import notices from 'notices';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { removeNotice } from './state/notices/actions';

const debug = debugModule( 'calypso:notices' );

require( './style.scss' );

class NoticesList extends React.Component {
	static displayName = 'NoticesList';

	static propTypes = {
		id: PropTypes.string,
		notices: PropTypes.oneOfType( [
			PropTypes.object,
			PropTypes.array
		] )
	};

	static defaultProps = {
		id: 'overlay-notices',
		notices: Object.freeze( [] )
	};

	componentWillMount() {
		debug( 'Mounting Global Notices React component.' );
	}

	removeNotice = ( notice ) => {
		if ( notice ) {
			notices.removeNotice( notice );
		}
	};

	render() {
		const noticesRaw = this.props.notices[ this.props.id ] || [];
		let noticesList = noticesRaw.map( function( notice, index ) {
			return (
				<SimpleNotice
					key={ 'notice-old-' + index }
					status={ notice.status }
					duration={ notice.duration || null }
					text={ notice.text }
					isCompact={ notice.isCompact }
					onDismissClick={ this.removeNotice.bind( this, notice ) }
					showDismiss={ notice.showDismiss }
				>
					{ notice.button &&
						<NoticeAction
							href={ notice.href }
							onClick={ notice.onClick }
						>
							{ notice.button }
						</NoticeAction> }
					</SimpleNotice>
			);
		}, this );

		//This is an interim solution for displaying both notices from redux store
		//and from the old component. When all notices are moved to redux store, this component
		//needs to be updated.
		noticesList = noticesList.concat( this.props.storeNotices.map( function( notice, index ) {
			return (
				<SimpleNotice
					key={ 'notice-' + index }
					status={ notice.status }
					duration = { notice.duration || null }
					showDismiss={ notice.showDismiss }
					onDismissClick={ this.props.removeNotice.bind( this, notice.noticeId ) }
					text={ notice.text }>
				</SimpleNotice>
			);
		}, this ) );

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
			storeNotices: state.globalNotices
		};
	},
	dispatch => bindActionCreators( { removeNotice }, dispatch )
)( NoticesList );
