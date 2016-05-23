/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import { translate as __ } from 'lib/mixins/i18n';

/**
 * Internal dependencies
 */
import {
	getJetpackNotices as _getJetpackNotices
} from 'state/jetpack-notices';
import { getSiteConnectionStatus as _getSiteConnectionStatus } from 'state/connection';
import {
	isNoticeDismissed as _isNoticeDismissed,
	dismissJetpackNotice
} from 'state/jetpack-notices';

const JetpackNotices = React.createClass( {
	displayName: 'JetpackNotices',

	maybeShowWelcomeNotice: function() {
		if ( this.props.isDismissed( 'welcome' ) ) {
			return;
		}
		return (
			<div>
				<SimpleNotice
					status="is-success"
					onClick={ this.props.dismissWelcomeNotice }
				>
					Welcome to Jetpack in React! (this message is not complete)
				</SimpleNotice>
			</div>
		);
	},
	maybeShowDevVersion: function() {
		if ( window.Initial_State.isDevVersion ) {
			const text = __( 'You are currently running a development version of Jetpack. {{a}} Submit your feedback {{/a}}',
				{
					components: {
						a: <a href="https://jetpack.com/contact-support/beta-group/" target="_blank" />
					}
				}
			);

			return (
				<SimpleNotice showDismiss={ false }>
					{ text }
				</SimpleNotice>
			);
		}
	},
	maybeShowDevMode: function() {
		const devMode = window.Initial_State.connectionStatus.devMode;
		if ( ! devMode.isActive ) {
			return;
		}

		let devModeType = '';
		if ( devMode.filter ) { devModeType += __( 'the jetpack_development_mode filter. ' ); }
		if ( devMode.constant ) { devModeType += __( 'the JETPACK_DEV_DEBUG constant. ' ); }
		if ( devMode.url ) { devModeType += __( 'your site URL lacking a dot (e.g. http://localhost).' ); }

		const text = __( 'Currently in {{a}}Development Mode{{/a}} VIA ' + devModeType,
			{
				components: {
					a: <a href="https://jetpack.com/support/development-mode/" target="_blank" />
				}
			}
		);

		return (
			<SimpleNotice showDismiss={ false }>
				{ text }
			</SimpleNotice>
		);
	},
	maybeShowStagingSite: function() {
		if ( window.Initial_State.connectionStatus.isStaging ) {
			const text = __( 'You are running Jetpack on a {{a}}staging server{{/a}}.',
				{
					components: {
						a: <a href="https://jetpack.com/support/staging-sites/" target="_blank" />
					}
				}
			);

			return (
				<SimpleNotice showDismiss={ false }>
					{ text }
				</SimpleNotice>
			);
		}
	},

	actionNotices: function() {
		const notices = this.props.jetpackNotices( this.props );

		if ( 'disconnected' === notices ) {
			return (
				<div>
					<SimpleNotice>
						{ __( 'You have successfully disconnected Jetpack' ) }
						<br/>
						{
							__(	'Would you tell us why? Just {{a}}answering two simple questions{{/a}} would help us improve Jetpack.',
								{
									components: {
										a: <a href="https://jetpack.com/survey-disconnected/" target="_blank" />
									}
								}
							)
						}
					</SimpleNotice>
				</div>
			);
		}
	},

	render() {
		return (
			<div>
				{ this.maybeShowWelcomeNotice() }
				{ this.maybeShowDevVersion() }
				{ this.maybeShowDevMode() }
				{ this.maybeShowStagingSite() }
				{ this.actionNotices() }
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			jetpackNotices: () => _getJetpackNotices( state ),
			isDismissed: ( notice ) => _isNoticeDismissed( state, notice )
		};
	},
	( dispatch ) => {
		return {
			dismissWelcomeNotice: () => {
				return dispatch( dismissJetpackNotice( 'welcome' ) );
			}
		};
	}
)( JetpackNotices );
