/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	getJetpackNotices as _getJetpackNotices
} from 'state/jetpack-notices';
import {
	isNoticeDismissed as _isNoticeDismissed,
	dismissJetpackActionNotice
} from 'state/jetpack-notices';

const DismissableNotices = React.createClass( {
	displayName: 'DismissableNotices',

	renderNotices: function() {
		const notices = this.props.jetpackNotices;

		switch ( notices ) {
			case 'disconnected' :
				if ( this.props.isDismissed( notices ) ) {
					return false;
				}
				return (
					<div>
						<SimpleNotice
							onDismissClick={ this.props.dismissJetpackActionNotice.bind( null, notices ) }
						>
							{ __( 'You have successfully disconnected Jetpack' ) }
							<br />
							{
								__( 'Would you tell us why? Just {{a}}answering two simple questions{{/a}} would help us improve Jetpack.', {
									components: {
										a: <a href="https://jetpack.com/survey-disconnected/" target="_blank" rel="noopener noreferrer" />
									}
								} )
							}
						</SimpleNotice>
					</div>
				);

			default:
				return false;
		}
	},

	render() {
		return (
			<div>
				{ this.renderNotices() }
			</div>
		)
	}
} );

export default connect(
	state => {
		return {
			jetpackNotices: _getJetpackNotices( state ),
			isDismissed: ( notice ) => _isNoticeDismissed( state, notice )
		};
	},
	( dispatch ) => {
		return bindActionCreators( {
			dismissJetpackActionNotice
		}, dispatch );
	}
)( DismissableNotices );
