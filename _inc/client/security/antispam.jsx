/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import FoldableCard from 'components/foldable-card';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLabel } from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Antispam = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, ! value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Spam filtering', { context: 'Settings header' } ) }>
					<FoldableCard
						header={ __( 'Your site is protected from spam' ) }
					>
						<SettingsGroup support="https://akismet.com/jetpack/">
							<FormFieldset>
								<FormLabel>
									<span className="jp-form-label-wide">{ __( 'Your API key' ) }</span>
									<TextInput
										name={ 'wordpress_api_key' }
										value={ this.props.getOptionValue( 'wordpress_api_key' ) }
										disabled={ this.props.isSavingAnyOption( 'wordpress_api_key' ) }
										onChange={ this.props.onOptionChange } />
								</FormLabel>
								<p className="jp-form-setting-explanation" >
									{
										__( "If you don't already have an API key, then {{a}}get your API key here{{/a}}, and you'll be guided through the process of getting one in a new window.", {
											components: {
												a: <a href={ 'https://akismet.com/wordpress/' } />
											}
										} )
									}
								</p>
							</FormFieldset>
						</SettingsGroup>
					</FoldableCard>
				</SettingsCard>
			);
		}
	} )
);
