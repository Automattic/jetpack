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

export const WelcomeNotice = React.createClass( {
	displayName: 'WelcomeNotice',

	render() {
		if ( this.props.isDismissed( 'welcome' ) ) {
			return false;
		}
		return (
			<div>
				<SimpleNotice
					status="is-info"
					onClick={ this.props.dismissWelcomeNotice }
				>
					{
						__( 'Welcome to your new Jetpack dashboard! Now you can quickly manage all of Jetpack’s great features from one central location. {{a}}Learn more (link to updated docs).{{/a}}', {
							components: {
								a:<a href={ 'https://jetpack.com/support/' } target="_blank" />
							}
						} )
					}
				</SimpleNotice>
			</div>
		);
	}

} );

export const DevVersionNotice = React.createClass( {
	displayName: 'DevVersionNotice',

	render() {
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

		return false;
	}

} );

export const StagingSiteNotice = React.createClass( {
	displayName: 'StagingSiteNotice',

	render() {
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

		return false;
	}

} );

export const DevModeNotice = React.createClass( {
	displayName: 'DevModeNotice',

	render() {
		const devMode = window.Initial_State.connectionStatus.devMode;
		if ( devMode.isActive ) {
			let devModeType = '';
			if (devMode.filter) {
				devModeType += __('the jetpack_development_mode filter. ');
			}
			if (devMode.constant) {
				devModeType += __('the JETPACK_DEV_DEBUG constant. ');
			}
			if (devMode.url) {
				devModeType += __('your site URL lacking a dot (e.g. http://localhost).');
			}

			const text = __('Currently in {{a}}Development Mode{{/a}} VIA ' + devModeType,
				{
					components: {
						a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>
					}
				}
			);

			return (
				<SimpleNotice showDismiss={ false }>
					{ text }
				</SimpleNotice>
			);
		}

		return false;
	}

} );


/**
 * These notices are triggered by actions in the app, like:
 * - Disconnecting
 * - Connecting
 * - Unlink
 * - Activate Module, etc...
 *
 * It will probably break off into it's own thing when it gets bigger.
 * It listens to the notice actions via this.props.jetpackNotices( this.props );
 */
export const ActionNotices = React.createClass( {
	displayName: 'ActionNotices',

	render() {
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

		return false;
	}

} );


const JetpackNotices = React.createClass( {
	displayName: 'JetpackNotices',

	render() {
		return (
			<div>
				<WelcomeNotice { ...this.props } />
				<DevVersionNotice { ...this.props } />
				<DevModeNotice { ...this.props } />
				<StagingSiteNotice { ...this.props } />
				<ActionNotices { ...this.props } />
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
