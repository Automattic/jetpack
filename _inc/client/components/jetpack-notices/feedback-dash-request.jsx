/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'lib/mixins/i18n';
import Card from 'components/card';
import SimpleNotice from 'components/notice';

/**
 * Internal dependencies
 */
import {
	isNoticeDismissed as _isNoticeDismissed,
	dismissJetpackNotice
} from 'state/jetpack-notices';

const FeedbackDashRequest = React.createClass( {
	displayName: 'FeedbackDashRequest',
	renderContent: function( e ) {
		if ( this.props.isDismissed( 'feedback_dash_request' ) ) {
			return;
		}

		return (
			<div>
				<SimpleNotice
					className="jp-dash-item__feedback-request"
					status="is-basic"
					onClick={ this.props.dismissNotice }
				>
				{
					__( 'What would you like to see on your Jetpack Dashboard? {{a}}Let us know!{{/a}}', {
						components: {
							a: <a href="https://jetpack.com/contact" target="_blank" />
						}
					} )
				}
				</SimpleNotice>
			</div>
		);
	},

	render() {
		return (
			<div>
				{ this.renderContent() }
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			isDismissed: ( notice ) => _isNoticeDismissed( state, notice )
		};
	},
	( dispatch ) => {
		return {
			dismissNotice: () => {
				return dispatch( dismissJetpackNotice( 'feedback_dash_request' ) );
			}
		};
	}
)( FeedbackDashRequest );
