/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingMultipleSelectCheckboxes } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import InlineExpand from 'components/inline-expand';

export const SiteStats = moduleSettingsForm(
	React.createClass( {

		render() {
			let stats = this.props.getModule( 'stats' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'stats' );
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Site stats' ) }
					module="stats">
					<SettingsGroup disableInDevMode module={ stats }>
						<FormFieldset>
							<ModuleToggle slug="stats"
										  compact
										  disabled={ unavailableInDevMode }
										  activated={ !!this.props.getOptionValue( 'admin_bar' ) }
										  toggling={ this.props.isSavingAnyOption( [ 'stats', 'admin_bar' ] ) }
										  toggleModule={ m => this.props.updateFormStateModuleOption( m, 'admin_bar' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Put a chart showing 48 hours of views in the admin bar.' )
								}
							</span>
							</ModuleToggle>
							<ModuleToggle slug="stats"
										  compact
										  disabled={ unavailableInDevMode }
										  activated={ !!this.props.getOptionValue( 'hide_smile' ) }
										  toggling={ this.props.isSavingAnyOption( [ 'stats', 'hide_smile' ] ) }
										  toggleModule={ m => this.props.updateFormStateModuleOption( m, 'hide_smile' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Hide the stats smiley face image. The image helps collect stats, but should work when hidden.' )
								}
							</span>
							</ModuleToggle>
						</FormFieldset>
						<InlineExpand
							disabled={ unavailableInDevMode }
							label={ __( 'Advanced Options' ) }>
							{
								! unavailableInDevMode && (
									<div>
										<FormFieldset>
											<FormLegend>{ __( 'Registered Users: Count the page views of registered users who are logged in' ) }</FormLegend>
											<ModuleSettingMultipleSelectCheckboxes
												name={ 'count_roles' }
												{ ...this.props }
												validValues={ this.props.getSiteRoles() } />
										</FormFieldset>
										<FormFieldset>
											<FormLegend>{ __( 'Report Visibility: Select the roles that will be able to view stats reports' ) }</FormLegend>
											<ModuleSettingMultipleSelectCheckboxes
												always_checked={ [ 'administrator' ] }
												name={ 'roles' }
												{ ...this.props }
												validValues={ this.props.getSiteRoles() } />
										</FormFieldset>
									</div>
								)
							}
						</InlineExpand>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
