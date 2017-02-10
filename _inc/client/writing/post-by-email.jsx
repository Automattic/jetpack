/**
 * External dependencies
 */
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
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

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
				isPbeActive = this.props.getOptionValue( 'post-by-email' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'post-by-email' );
			return (
				<SettingsCard
					{ ...this.props }
					module="post-by-email"
					hideButton>
					<SettingsGroup hasChild disableInDevMode module={ postByEmail }>
						<ModuleToggle
							slug="post-by-email"
							compact
							disabled={ unavailableInDevMode }
							activated={ isPbeActive }
							toggling={ this.props.isSavingAnyOption( 'post-by-email' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
						<span className="jp-form-toggle-explanation">
							{
								this.props.getModule( 'post-by-email' ).description
							}
						</span>
						</ModuleToggle>
						<FormFieldset>
							<FormLabel>
								<FormLegend>{ __( 'Email Address' ) }</FormLegend>
								<ClipboardButtonInput
									value={ this.address() }
									disabled={ ! isPbeActive || unavailableInDevMode }
									copy={ __( 'Copy', { context: 'verb' } ) }
									copied={ __( 'Copied!' ) }
									prompt={ __( 'Highlight and copy the following text to your clipboard:' ) }
								/>
							</FormLabel>
							<Button
								disabled={ ! isPbeActive || unavailableInDevMode }
								onClick={ this.regeneratePostByEmailAddress } >
								{ __( 'Regenerate address' ) }
							</Button>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
