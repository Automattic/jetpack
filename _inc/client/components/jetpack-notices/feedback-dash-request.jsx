/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

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
			<Card className="jp-dash-item__feedback-request">
				<p className="jp-dash-item__description">
					<a
						onClick={ this.props.dismissNotice }
						href="#"
					>
						[dismiss] 
					</a>
					{
						__( 'What would you like to see on your Jetpack Dashboard? {{a}}Send us some feedback and let us know!{{/a}}', {
							components: {
								a: <a href="https://jetpack.com/contact" target="_blank" />
							}
						} )
					}
				</p>
			</Card>
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
