/**
 * External dependencies
 */
import React from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend,
	FormLabel
} from 'components/forms';
import TextInput from 'components/text-input';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';

const GoogleAnalytics = React.createClass( {
	render() {
		const translate = this.props.translate;

		const isModuleActive = true; // this.props.getOptionValue( 'google_analytics_tracking_id' )

		return (
			<SettingsCard
				{ ...this.props }
				header={ translate( 'Google Analytics', { context: 'Settings Header' } ) } >
				<SettingsGroup hasChild support="https://support.wordpress.com/google-analytics/">
					<ModuleToggle slug="google-analytics"
						compact
						activated={ isModuleActive }
						toggling={ this.props.isSavingAnyOption( 'google-analytics' ) }
						toggleModule={ this.props.toggleModuleNow } >
					<span className="jp-form-toggle-explanation">{ this.props.getModule( 'google-analytics' ).description }</span>
					</ModuleToggle>
					<p className="jp-form-setting-explanation">{ translate( 'lorem ipsum dolor' ) }</p>
						<p className="jp-form-setting-explanation">
							{
								translate( 'Enter your tracking Id value to track your blog with {{a}}Google Analytics{{/a}}.', {
									components: {
										a: <a href="https://www.google.com/analytics/" target="_blank" />
									}
								} )
							}
						</p>
					<FormFieldset>
						<FormLabel>
							<FormLegend>{ translate( 'Google Analytics Tracking Id' ) }</FormLegend>
							<TextInput
								name={ 'google_analytics_tracking_id' }
								value={ this.props.getOptionValue( 'google_analytics_tracking_id' ) }
								placeholder={ translate( 'Example: UA-11111111-1' ) }
								className="widefat code"
								disabled={ this.props.isUpdating( 'google_analytics_tracking_id' ) }
								onChange={ this.props.onOptionChange } />
						</FormLabel>
					</FormFieldset>
				</SettingsGroup>
			</SettingsCard>
		);
	}
} );

export default localize( moduleSettingsForm( GoogleAnalytics ) );
