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
import { FormFieldset } from 'components/forms';
import ExternalLink from 'components/external-link';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingCheckbox } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';

export const Subscriptions = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					module="subscriptions">
					<ModuleToggle slug={ 'subscriptions' }
								  compact
								  activated={ this.props.getOptionValue( 'subscriptions' ) }
								  toggling={ this.props.isSavingAnyOption() }
								  toggleModule={ this.toggleModule }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Allow users to subscribe to your posts and comments and receive notifications via email.' )
							}
						</span>
					</ModuleToggle>
					<p>
						<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ 'https://wordpress.com/people/email-followers/' + this.props.siteRawUrl }>{ __( 'View your Email Followers' ) }</ExternalLink>
					</p>
					<FormFieldset>
						<ModuleSettingCheckbox
							name={ 'stb_enabled' }
							{ ...this.props }
							label={ __( 'Show a "follow blog" options in the comment form' ) } />
						<ModuleSettingCheckbox
							name={ 'stc_enabled' }
							{ ...this.props }
							label={ __( 'Show a "follow comments" option in the comment form.' ) } />
					</FormFieldset>
				</SettingsCard>
			);
		}
	} )
);
