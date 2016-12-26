/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import Button from 'components/button';
import Textarea from 'components/textarea';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend,
	FormLabel
} from 'components/forms';
import ExternalLink from 'components/external-link';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';

export const Protect = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		getInitialState() {
			return {
				whitelist: this.props.getOptionValue( 'jetpack_protect_global_whitelist' )
					? this.props.getOptionValue( 'jetpack_protect_global_whitelist' ).local
					: ''
			};
		},

		currentIpIsWhitelisted() {
			// get current whitelist in textarea from this.state.whitelist;
			return !!includes( this.state.whitelist, this.props.currentIp );
		},

		updateText( event ) {
			// Enable button if IP is not in the textarea
			this.currentIpIsWhitelisted();

			// Update textarea value
			this.setState( {
				whitelist: event.target.value
			} );

			// Add textarea content to form values to save
			this.props.onOptionChange( event );
		},

		addToWhitelist() {
			let newWhitelist = this.state.whitelist + ( 0 >= this.state.whitelist.length ? '' : '\n' ) + this.props.currentIp;

			// Update form value manually
			this.props.updateFormStateOptionValue( 'jetpack_protect_global_whitelist', newWhitelist );

			// add to current state this.state.whitelist;
			this.setState( {
				whitelist: newWhitelist
			} );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					module="protect"
					header={ __( 'Brute force protection', { context: 'Settings header' } ) } >
					<ModuleToggle slug={ 'protect' }
								  compact
								  activated={ this.props.getOptionValue( 'protect' ) }
								  toggling={ this.props.isSavingAnyOption() }
								  toggleModule={ this.toggleModule }>
						<span className="jp-form-toggle-explanation">
							{
								this.props.getModule( 'protect' ).description
							}
						</span>
						<p className="jp-form-setting-explanation">
							{
								__( 'Secure user authentication.' )
							}
						</p>
					</ModuleToggle>
					{
						this.props.currentIp
							? <p>
								{
									__( 'Your Current IP: %(ip)s', { args: { ip: this.props.currentIp } } )
								}
								<br />
								{
									<Button
										disabled={ this.currentIpIsWhitelisted() }
										onClick={ this.addToWhitelist }
										compact >{ __( 'Add to whitelist' ) }</Button>
								}
							  </p>
							: ''
					}
					<FormFieldset>
						<FormLegend>{ __( 'Whitelisted IP addresses' ) }</FormLegend>
						<FormLabel>
						<Textarea
							name={ 'jetpack_protect_global_whitelist' }
							placeholder={ 'Example: 12.12.12.1-12.12.12.100' }
							onChange={ this.updateText }
							value={ this.state.whitelist } />
						</FormLabel>
						<span className="jp-form-setting-explanation">
							{
								__( 'You may whitelist an IP address or series of addresses preventing them from ever being blocked by Jetpack. IPv4 and IPv6 are acceptable. To specify a range, enter the low value and high value separated by a dash. Example: 12.12.12.1-12.12.12.100', {
									components: {
										br: <br />
									}
								} )
							}
						</span>
					</FormFieldset>
				</SettingsCard>
			)
		}
	} )
);
