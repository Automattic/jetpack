/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import CompactFormToggle from 'components/form/form-toggle/compact';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import {
	ModuleSettingsForm as moduleSettingsForm,
} from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Monitor = moduleSettingsForm(
	class extends Component {
		/**
		 * Get options for initial state.
		 */
		state = {
			monitor_receive_notifications: this.props.getOptionValue( 'monitor_receive_notifications', 'monitor' ),
			monitor_receive_wp_notifications: this.props.getOptionValue( 'monitor_receive_wp_notifications', 'monitor' ),
		};

		handleWPNotificationsToggleChange = () => {
			this.updateOptions( 'monitor_receive_wp_notifications' );
		}

		handleEmailNotificationsToggleChange = () => {
			this.updateOptions( 'monitor_receive_notifications' );
		}

		/**
		 * Update state so toggles are updated.
		 *
		 * @param {string} optionName The slug of the option to update
		 */
		updateOptions = optionName => {
			this.setState(
				{
					[ optionName ]: ! this.state[ optionName ],
				},
				this.props.updateFormStateModuleOption( 'monitor', optionName )
			);
		};

		render() {
			const isMonitorActive = this.props.getOptionValue( 'monitor' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'monitor' );
			return (
				<SettingsCard
					{ ...this.props }
					hideButton
					module="monitor"
					header={ __( 'Monitor', { context: 'Settings header' } ) }
				>
					<SettingsGroup hasChild disableInDevMode module={ this.props.getModule( 'monitor' ) }>
						<ModuleToggle
							slug="monitor"
							disabled={ unavailableInDevMode }
							activated={ isMonitorActive }
							toggling={ this.props.isSavingAnyOption( 'monitor' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ __( "Monitor your site's uptime" ) }
							</span>
						</ModuleToggle>
						<FormFieldset>
							<CompactFormToggle
								checked={ this.state.monitor_receive_notifications }
								disabled={
									! isMonitorActive ||
										unavailableInDevMode ||
										this.props.isSavingAnyOption( [ 'monitor', 'monitor_receive_notifications' ] )
								}
								onChange={ this.handleEmailNotificationsToggleChange }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Send notifications to your {{a}}WordPress.com email address{{/a}}', {
										components: {
											a: (
												<a
													href="https://wordpress.com/me/account"
													rel="noopener noreferrer"
												/>
											),
										},
									} ) }
								</span>
							</CompactFormToggle>
							<CompactFormToggle
								checked={ this.state.monitor_receive_wp_notifications }
								disabled={
									! isMonitorActive ||
										unavailableInDevMode ||
										this.props.isSavingAnyOption( [ 'monitor', 'monitor_receive_wp_notifications' ] )
								}
								onChange={ this.handleWPNotificationsToggleChange }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Send notifications via WordPress.com notification' ) }
								</span>
							</CompactFormToggle>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	}
);
