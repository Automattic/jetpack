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
import SettingsGroup from 'components/settings-group';

export const Subscriptions = moduleSettingsForm(
	React.createClass( {

		render() {
			let subscriptions = this.props.getModule( 'subscriptions' ),
				isSubscriptionsActive = this.props.getOptionValue( 'subscriptions' );
			return (
				<SettingsCard
					{ ...this.props }
					module="subscriptions">
					<SettingsGroup hasChild support={ subscriptions.learn_more_button }>
						<ModuleToggle slug="subscriptions"
									  compact
									  activated={ isSubscriptionsActive }
									  toggling={ this.props.isSavingAnyOption( 'subscriptions' ) }
									  toggleModule={ this.props.toggleModuleNow }>
						<span className="jp-form-toggle-explanation">
							{
								subscriptions.description
							}
						</span>
						</ModuleToggle>
						{
							isSubscriptionsActive
								? <FormFieldset>
									<ModuleSettingCheckbox
										name={ 'stb_enabled' }
										{ ...this.props }
										label={ __( 'Show a "follow blog" option in the comment form' ) } />
									<ModuleSettingCheckbox
										name={ 'stc_enabled' }
										{ ...this.props }
										label={ __( 'Show a "follow comments" option in the comment form.' ) } />
										<p>
											<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ 'https://wordpress.com/people/email-followers/' + this.props.siteRawUrl }>{ __( 'View your Email Followers' ) }</ExternalLink>
										</p>
									</FormFieldset>
								: ''
						}
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
