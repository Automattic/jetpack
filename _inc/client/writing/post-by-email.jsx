/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import ClipboardButtonInput from 'components/clipboard-button-input';

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
import {
	SettingsCard,
	SettingsGroup
} from 'components/settings-card';

export const PostByEmail = moduleSettingsForm(
	React.createClass( {

		regeneratePostByEmailAddress( event ) {
			event.preventDefault();
			this.props.regeneratePostByEmailAddress();
		},

		address() {
			const currentValue = this.props.getOptionValue( 'post_by_email_address' );
			// If the module Post-by-email is enabled BUT it's configured as disabled
			// Its value is set to false
			if ( currentValue === false ) {
				return '';
			}
			return currentValue;
		},

		render() {
			let postByEmail = this.props.getModule( 'post-by-email' ),
				isPbeActive = this.props.getOptionValue( 'post-by-email' );
			return (
				<SettingsCard
					{ ...this.props }
					module="post-by-email"
					hideButton>
					<SettingsGroup hasChild support={ postByEmail.learn_more_button }>
						<ModuleToggle slug="post-by-email"
									  compact
									  activated={ isPbeActive }
									  toggling={ this.props.isSavingAnyOption( 'post-by-email' ) }
									  toggleModule={ this.props.toggleModuleNow }>
						<span className="jp-form-toggle-explanation">
							{
								this.props.getModule( 'post-by-email' ).description
							}
						</span>
						</ModuleToggle>
						{
							isPbeActive
								? <FormFieldset>
									<FormLabel>
										<FormLegend>{ __( 'Email Address' ) }</FormLegend>
										<ClipboardButtonInput
											value={ this.address() }
											copy={ __( 'Copy', { context: 'verb' } ) }
											copied={ __( 'Copied!' ) }
											prompt={ __( 'Highlight and copy the following text to your clipboard:' ) }
										/>
									</FormLabel>
									<Button
										onClick={ this.regeneratePostByEmailAddress } >
										{ __( 'Regenerate address' ) }
									</Button>
								  </FormFieldset>
								: ''
						}
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
