/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Monitor = withModuleSettingsFormHelpers(
	class extends Component {
		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-monitor' );
		};

		render() {
			const isMonitorActive = this.props.getOptionValue( 'monitor' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'monitor' );
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					module="monitor"
					header={ __( 'Downtime monitoring', { context: 'Settings header' } ) }
				>
					<SettingsGroup
						hasChild
						disableInDevMode
						module={ this.props.getModule( 'monitor' ) }
						support={ {
							text: __(
								'Jetpack will continuously monitor your site, and alert you the moment downtime is detected.'
							),
							link: 'https://jetpack.com/support/monitor/',
						} }
					>
						<ModuleToggle
							slug="monitor"
							disabled={ unavailableInDevMode }
							activated={ isMonitorActive }
							toggling={ this.props.isSavingAnyOption( 'monitor' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __(
									'Get alerts if your site goes offline. We’ll let you know when it’s back up, too.'
								) }
							</span>
						</ModuleToggle>
					</SettingsGroup>
					{
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackConfigureClick }
							href={ 'https://wordpress.com/settings/security/' + this.props.siteRawUrl }
						>
							{ __( 'Configure your notification settings' ) }
						</Card>
					}
				</SettingsCard>
			);
		}
	}
);
