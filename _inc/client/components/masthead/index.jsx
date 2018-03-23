/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import includes from 'lodash/includes';
import ButtonGroup from 'components/button-group';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus } from 'state/connection';
import { getCurrentVersion, userCanEditPosts } from 'state/initial-state';
import { imagePath } from 'constants/urls';

export class Masthead extends React.Component {
	static defaultProps = {
		route: { path: '' }
	};

	trackDashClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'nav_dashboard'
		} );
	};

	trackSettingsClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'nav_settings'
		} );
	};

	trackLogoClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'logo'
		} );
	};

	render() {
		const devNotice = this.props.siteConnectionStatus === 'dev'
			? <code>Dev Mode</code>
			: '',
			isDashboardView = includes( [ '/', '/dashboard', '/apps', '/plans' ], this.props.route.path ),
			isStatic = '' === this.props.route.path;

		return (
			<div className="jp-masthead">
				<div className="jp-masthead__inside-container">
					<div className="jp-masthead__logo-container">
						<a onClick={ this.trackLogoClick } className="jp-masthead__logo-link" href="#dashboard">
							<img alt="" src={ imagePath + 'jetpack-logo-green.svg' } />
						</a>
						{ devNotice }
					</div>
					{
						this.props.userCanEditPosts && (
							<div className="jp-masthead__nav">
								{ ( ! isStatic && this.props.siteConnectionStatus ) &&
									<ButtonGroup>
										<Button
											compact={ true }
											href="#/dashboard"
											primary={ isDashboardView && ! isStatic }
											onClick={ this.trackDashClick }
										>
											{ __( 'Dashboard' ) }
										</Button>
										<Button
											compact={ true }
											href="#/settings"
											primary={ ! isDashboardView && ! isStatic }
											onClick={ this.trackSettingsClick }
										>
											{ __( 'Settings' ) }
										</Button>
									</ButtonGroup>
								}
							</div>
						)
					}
				</div>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			siteConnectionStatus: getSiteConnectionStatus( state ),
			currentVersion: getCurrentVersion( state ),
			userCanEditPosts: userCanEditPosts( state )
		};
	}
)( Masthead );
