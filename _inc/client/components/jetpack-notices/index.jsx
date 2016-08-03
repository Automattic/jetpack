/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import { translate as __ } from 'i18n-calypso';
import NoticesList from 'components/global-notices';

/**
 * Internal dependencies
 */
import JetpackStateNotices from './state-notices';
import {
	getJetpackNotices as _getJetpackNotices
} from 'state/jetpack-notices';
import { getSiteConnectionStatus, getSiteDevMode, isStaging } from 'state/connection';
import { isDevVersion } from 'state/initial-state';
import {
	isNoticeDismissed as _isNoticeDismissed,
	dismissJetpackNotice
} from 'state/jetpack-notices';

/**
 * Welcome Notice for 1st time connections.
 * Decided not to show this.  See https://github.com/Automattic/jetpack/issues/4082
 */
export const WelcomeNotice = React.createClass( {
	displayName: 'WelcomeNotice',
	getInitialState: function() {
		return { showNotice: true };
	},

	dismissWelcomeNotice: function() {
		this.setState( { showNotice: false } );
	},

	propTypes: {
		jumpstarted: React.PropTypes.bool
	},

	getDefaultProps() {
		return {
			jumpstarted: false
		};
	},

	getWelcomeMessageText: function() {
		if ( this.props.jumpstarted ) {
			return(
				__( 'Great choice! By Jumpstarting your site, you have unlocked even more power of wordpress.com! {{a}}Learn more{{/a}}', {
					components: {
						a: <a href={ 'https://jetpack.com/support/' } target="_blank" />
					}
				} )
			);
		} else {
			return(
				__( 'Welcome to your Jetpack dashboard! Now you can quickly manage all of Jetpack’s great features from one central location. {{a}}Learn more{{/a}}.', {
					components: {
						a: <a href={ 'https://jetpack.com/support/' } target="_blank" />
					}
				} )
			);
		}
	},

	render() {
		if ( ! this.state.showNotice ) {
			return false;
		}
		return (
			<div>
				<SimpleNotice
					status="is-info"
					onDismissClick={ this.dismissWelcomeNotice }
				>
					{ this.getWelcomeMessageText() }
				</SimpleNotice>
			</div>
		);
	}

} );

export const DevVersionNotice = React.createClass( {
	displayName: 'DevVersionNotice',

	render() {
		if ( isDevVersion( this.props ) ) {
			const text = __( 'You are currently running a development version of Jetpack. {{a}} Submit your feedback {{/a}}',
				{
					components: {
						a: <a href="https://jetpack.com/contact-support/beta-group/" target="_blank" />
					}
				}
			);

			return (
				<SimpleNotice
					showDismiss={ false }
					status="is-basic"
				>
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
		if ( isStaging( this.props ) ) {
			const text = __( 'You are running Jetpack on a {{a}}staging server{{/a}}.',
				{
					components: {
						a: <a href="https://jetpack.com/support/staging-sites/" target="_blank" />
					}
				}
			);

			return (
				<SimpleNotice
					showDismiss={ false }
					status="is-basic"
				>
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
		if ( getSiteConnectionStatus( this.props ) === 'dev' ) {
			const devMode = getSiteDevMode( this.props );
			let text;
			if ( devMode.filter ) {
				text = __('Currently in {{a}}Development Mode{{/a}} via the jetpack_development_mode filter.{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			} else if ( devMode.constant ) {
				text = __('Currently in {{a}}Development Mode{{/a}} via the JETPACK_DEV_DEBUG constant.{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			} else if ( devMode.url ) {
				text = __('Currently in {{a}}Development Mode{{/a}} because your site URL lacks a dot (e.g. http://localhost).{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			}

			return (
				<SimpleNotice
					showDismiss={ false }
					status="is-basic"
				>
					{ text }
				</SimpleNotice>
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
				<NoticesList { ...this.props } />
				<JetpackStateNotices />
				<DevVersionNotice { ...this.props } />
				<DevModeNotice { ...this.props } />
				<StagingSiteNotice { ...this.props } />
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			jetpackNotices: _getJetpackNotices( state ),
			isDismissed: ( notice ) => _isNoticeDismissed( state, notice )
		};
	}
)( JetpackNotices );
