/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';

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
import { ModuleSettingCheckbox, ModuleSettingRadios } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';

export const Comments = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			let comments = this.props.getModule( 'comments' );

			return (
				<SettingsCard header={ __( 'Comments', { context: 'Settings header' } ) } { ...this.props } >
					<ModuleToggle slug={ 'comments' }
								  compact
								  activated={ this.props.getOptionValue( 'comments' ) }
								  toggling={ this.props.isSavingAnyOption() }
								  toggleModule={ this.toggleModule }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Use Jetpack comments. Let readers use their WordPress.com,	Twitter, Facebook or Google+ to leave comments on your posts and pages.' )
							}
						</span>
					</ModuleToggle>
					<FormFieldset>
						<FormLegend>{ __( 'Comments headline' ) }</FormLegend>
						<FormLabel>
							<TextInput
								name={ 'highlander_comment_form_prompt' }
								value={ this.props.getOptionValue( 'highlander_comment_form_prompt' ) }
								disabled={ this.props.isUpdating( 'highlander_comment_form_prompt' ) }
								onChange={ this.props.onOptionChange} />
						</FormLabel>
						<span className="jp-form-setting-explanation">{ __( 'A few catchy words to motivate your readers to comment.' ) }</span>
					</FormFieldset>
					<FormFieldset>
						<FormLegend>{ __( 'Color Scheme' ) }</FormLegend>
						<ModuleSettingRadios
							name={ 'jetpack_comment_form_color_scheme' }
							{ ...this.props }
							validValues={ this.props.validValues( 'jetpack_comment_form_color_scheme', 'comments' ) } />
					</FormFieldset>
				</SettingsCard>
			);
		}
	} )
);
