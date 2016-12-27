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
	FormLegend,
	FormLabel
} from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingSelect } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';

export const SiteStats = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Site stats' ) }
					module="stats">
					<FormFieldset>
						<ModuleToggle slug={ 'stats' }
									  compact
									  activated={ !!this.props.getOptionValue( 'admin_bar' ) }
									  toggling={ this.props.isSavingAnyOption() }
									  toggleModule={ m => this.props.updateFormStateModuleOption( m, 'admin_bar' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Put a chart showing 48 hours of views in the admin bar.' )
								}
							</span>
						</ModuleToggle>
						<br />
						<ModuleToggle slug={ 'stats' }
									  compact
									  activated={ !!this.props.getOptionValue( 'hide_smile' ) }
									  toggling={ this.props.isSavingAnyOption() }
									  toggleModule={ m => this.props.updateFormStateModuleOption( m, 'hide_smile' ) }>
							<span className="jp-form-toggle-explanation">
								{
									__( 'Hide the stats smiley face image. The image helps collect stats, but should work when hidden.' )
								}
							</span>
						</ModuleToggle>
					</FormFieldset>
				</SettingsCard>
			);
		}
	} )
);
