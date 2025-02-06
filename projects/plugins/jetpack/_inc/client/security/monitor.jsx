import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { FEATURE_DOWNTIME_MONITORING_JETPACK } from '../lib/plans/constants';

export const Monitor = withModuleSettingsFormHelpers(
	class extends Component {
		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-monitor-email' );
		};

		render() {
			const hasConnectedOwner = this.props.hasConnectedOwner,
				isMonitorActive = this.props.getOptionValue( 'monitor' ),
				unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'monitor' );
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					module="monitor"
					header={ _x( 'Downtime monitoring', 'Settings header', 'jetpack' ) }
					feature={ FEATURE_DOWNTIME_MONITORING_JETPACK }
				>
					<SettingsGroup
						hasChild
						disableInOfflineMode
						disableInSiteConnectionMode
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
							disabled={ unavailableInOfflineMode || ! hasConnectedOwner }
							activated={ isMonitorActive }
							toggling={ this.props.isSavingAnyOption( 'monitor' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ createInterpolateElement(
									__(
										'Get alerts if your site goes offline. Alerts are sent to your <a>WordPress.com account</a> email address.',
										'jetpack'
									),
									{
										a: (
											<ExternalLink
												href="https://wordpress.com/me/account"
												onClick={ this.trackConfigureClick }
											/>
										),
									}
								) }
							</span>
						</ModuleToggle>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
