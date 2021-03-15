/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import ConnectUserBar from 'components/connect-user-bar';

export const Monitor = withModuleSettingsFormHelpers(
	class extends Component {
		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-monitor' );
		};

		render() {
			const isMonitorActive = this.props.getOptionValue( 'monitor' ),
				unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'monitor' );
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					module="monitor"
					header={ _x( 'Downtime monitoring', 'Settings header', 'jetpack' ) }
				>
					<SettingsGroup
						hasChild
						disableInOfflineMode
						disableInUserlessMode
						module={ this.props.getModule( 'monitor' ) }
						support={ {
							text: __(
								'Jetpack will continuously monitor your site and alert you the moment downtime is detected.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-monitor' ),
						} }
					>
						<ModuleToggle
							slug="monitor"
							disabled={ unavailableInOfflineMode || ! this.props.hasConnectedOwner }
							activated={ isMonitorActive }
							toggling={ this.props.isSavingAnyOption( 'monitor' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __(
									'Get alerts if your site goes offline. We’ll let you know when it’s back up, too.',
									'jetpack'
								) }
							</span>
						</ModuleToggle>
					</SettingsGroup>
					{ this.props.hasConnectedOwner && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackConfigureClick }
							href={ getRedirectUrl( 'calypso-settings-security', {
								site: this.props.siteRawUrl,
							} ) }
						>
							{ __( 'Configure your notification settings', 'jetpack' ) }
						</Card>
					) }

					{ ! this.props.hasConnectedOwner && (
						<ConnectUserBar
							feature="monitor"
							featureLabel={ __( 'Downtime Monitoring', 'jetpack' ) }
							text={ __( 'Sign in to set up your status alerts.', 'jetpack' ) }
						/>
					) }
				</SettingsCard>
			);
		}
	}
);
