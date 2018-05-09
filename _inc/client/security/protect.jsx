/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import Textarea from 'components/textarea';
import includes from 'lodash/includes';
import FoldableCard from 'components/foldable-card';
import classNames from 'classnames';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { FormFieldset, FormLegend, FormLabel } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import {
	ModuleSettingsForm as moduleSettingsForm,
} from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Protect = moduleSettingsForm(
	class extends Component {
		state = {
			whitelist: this.props.getOptionValue( 'jetpack_protect_global_whitelist' )
				? this.props.getOptionValue( 'jetpack_protect_global_whitelist' ).local
				: '',
		};

		currentIpIsWhitelisted = () => {
			// get current whitelist in textarea from this.state.whitelist;
			return !! includes( this.state.whitelist, this.props.currentIp );
		};

		updateText = event => {
			// Enable button if IP is not in the textarea
			this.currentIpIsWhitelisted();

			// Update textarea value
			this.setState( {
				whitelist: event.target.value,
			} );

			// Add textarea content to form values to save
			this.props.onOptionChange( event );
		};

		addToWhitelist = () => {
			const newWhitelist =
				this.state.whitelist +
				( 0 >= this.state.whitelist.length ? '' : '\n' ) +
				this.props.currentIp;

			// Update form value manually
			this.props.updateFormStateOptionValue( 'jetpack_protect_global_whitelist', newWhitelist );

			// add to current state this.state.whitelist;
			this.setState( {
				whitelist: newWhitelist,
			} );

			analytics.tracks.recordJetpackClick( {
				target: 'add-to-whitelist',
				feature: 'protect',
			} );
		};

		trackOpenCard = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'foldable-settings-open',
				feature: 'protect',
			} );
		};

		render() {
			const isProtectActive = this.props.getOptionValue( 'protect' ),
				unavailableInDevMode = this.props.isUnavailableInDevMode( 'protect' ),
				toggle = (
					<ModuleToggle
						slug="protect"
						compact
						disabled={ unavailableInDevMode }
						activated={ isProtectActive }
						toggling={ this.props.isSavingAnyOption( 'protect' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ this.props.getModule( 'protect' ).description }
						</span>
					</ModuleToggle>
				);
			return (
				<SettingsCard
					{ ...this.props }
					module="protect"
					header={ __( 'Brute force attack protection', { context: 'Settings header' } ) }
					saveDisabled={ this.props.isSavingAnyOption( 'jetpack_protect_global_whitelist' ) }
				>
					<FoldableCard
						onOpen={ this.trackOpenCard }
						header={ toggle }
						className={ classNames( { 'jp-foldable-settings-disable': unavailableInDevMode } ) }
					>
						<SettingsGroup
							hasChild
							disableInDevMode
							module={ this.props.getModule( 'protect' ) }
							support={ {
								text: __( 'Protects your site from traditional and distributed brute force login attacks.' ),
								link: 'https://jetpack.com/support/protect/',
							} }
							>
							<FormFieldset>
								{ this.props.currentIp &&
									<div>
										<div className="jp-form-label-wide">
											{ __( 'Your current IP: %(ip)s', { args: { ip: this.props.currentIp } } ) }
										</div>
										{
											<Button
												disabled={
													! isProtectActive ||
														unavailableInDevMode ||
														this.currentIpIsWhitelisted() ||
														this.props.isSavingAnyOption(
															[ 'protect', 'jetpack_protect_global_whitelist' ]
														)
												}
												onClick={ this.addToWhitelist }
											>
												{ __( 'Add to whitelist' ) }
											</Button>
										}
									</div> }
								<FormLabel>
									<FormLegend>{ __( 'Whitelisted IP addresses' ) }</FormLegend>
									<Textarea
										disabled={
											! isProtectActive ||
												unavailableInDevMode ||
												this.props.isSavingAnyOption(
													[ 'protect', 'jetpack_protect_global_whitelist' ]
												)
										}
										name={ 'jetpack_protect_global_whitelist' }
										placeholder={ 'Example: 12.12.12.1-12.12.12.100' }
										onChange={ this.updateText }
										value={ this.state.whitelist }
									/>
								</FormLabel>
								<span className="jp-form-setting-explanation">
									{ __(
										'You may whitelist an IP address or series of addresses preventing them from ever being blocked by Jetpack. IPv4 and IPv6 are acceptable. To specify a range, enter the low value and high value separated by a dash. Example: 12.12.12.1-12.12.12.100',
										{
											components: {
												br: <br />,
											},
										}
									) }
								</span>
							</FormFieldset>
						</SettingsGroup>
					</FoldableCard>
				</SettingsCard>
			);
		}
	}
);
