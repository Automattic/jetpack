import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import ConnectUserBar from 'components/connect-user-bar';
import FoldableCard from 'components/foldable-card';
import { FormFieldset, FormLegend, FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import Textarea from 'components/textarea';
import analytics from 'lib/analytics';
import { includes } from 'lodash';
import React, { Component } from 'react';

export const Protect = withModuleSettingsFormHelpers(
	class extends Component {
		state = {
			safelist: this.props.getOptionValue( 'jetpack_protect_global_whitelist' )
				? this.props.getOptionValue( 'jetpack_protect_global_whitelist' ).local
				: '',
		};

		currentIpIsSafelisted = () => {
			// get current safelist in textarea from this.state.safelist;
			return !! includes( this.state.safelist, this.props.currentIp );
		};

		updateText = event => {
			// Enable button if IP is not in the textarea
			this.currentIpIsSafelisted();

			// Update textarea value
			this.setState( {
				safelist: event.target.value,
			} );

			// Add textarea content to form values to save
			this.props.onOptionChange( event );
		};

		addToSafelist = () => {
			const newSafelist =
				this.state.safelist +
				( 0 >= this.state.safelist.length ? '' : '\n' ) +
				this.props.currentIp;

			// Update form value manually
			this.props.updateFormStateOptionValue( 'jetpack_protect_global_whitelist', newSafelist );

			// add to current state this.state.safelist;
			this.setState( {
				safelist: newSafelist,
			} );

			analytics.tracks.recordJetpackClick( {
				target: 'add-to-whitelist', // Left as-is to preserve historical stats trends.
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
				unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'protect' ),
				toggle = (
					<ModuleToggle
						slug="protect"
						compact
						disabled={ unavailableInOfflineMode }
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
					header={ _x( 'Brute force protection', 'Settings header', 'jetpack' ) }
					saveDisabled={ this.props.isSavingAnyOption( 'jetpack_protect_global_whitelist' ) }
				>
					<SettingsGroup
						hasChild
						disableInOfflineMode
						disableInSiteConnectionMode
						module={ this.props.getModule( 'protect' ) }
						className="foldable-wrapper"
					>
						<FoldableCard onOpen={ this.trackOpenCard } header={ toggle }>
							<SettingsGroup
								hasChild
								module={ this.props.getModule( 'protect' ) }
								support={ {
									text: __(
										'Protects your site from traditional and distributed brute force login attacks.',
										'jetpack'
									),
									link: getRedirectUrl( 'jetpack-support-protect' ),
								} }
							>
								<FormFieldset>
									{ this.props.currentIp && (
										<div>
											<div className="jp-form-label-wide">
												{ sprintf(
													/* translators: placeholder is an IP address. */
													__( 'Your current IP: %s', 'jetpack' ),
													this.props.currentIp
												) }
											</div>
											{
												<Button
													disabled={
														! isProtectActive ||
														unavailableInOfflineMode ||
														this.currentIpIsSafelisted() ||
														this.props.isSavingAnyOption( [
															'protect',
															'jetpack_protect_global_whitelist',
														] )
													}
													onClick={ this.addToSafelist }
												>
													{ __( 'Add to Always Allowed list', 'jetpack' ) }
												</Button>
											}
										</div>
									) }
									<FormLabel>
										<FormLegend>{ __( 'Always allowed IP addresses', 'jetpack' ) }</FormLegend>
										<Textarea
											disabled={
												! isProtectActive ||
												unavailableInOfflineMode ||
												this.props.isSavingAnyOption( [
													'protect',
													'jetpack_protect_global_whitelist',
												] )
											}
											name={ 'jetpack_protect_global_whitelist' }
											placeholder={ 'Example: 12.12.12.1-12.12.12.100' }
											onChange={ this.updateText }
											value={ this.state.safelist }
										/>
									</FormLabel>
									<span className="jp-form-setting-explanation">
										{ __(
											'You may mark an IP address (or series of addresses) as "Always allowed", preventing them from ever being blocked by Jetpack. IPv4 and IPv6 are acceptable. To specify a range, enter the low value and high value separated by a dash. Example: 12.12.12.1-12.12.12.100',
											'jetpack'
										) }
									</span>
								</FormFieldset>
							</SettingsGroup>
						</FoldableCard>
					</SettingsGroup>

					{ ! this.props.hasConnectedOwner && ! this.props.isOfflineMode && (
						<ConnectUserBar
							feature="protect"
							featureLabel={ __( 'Protect', 'jetpack' ) }
							text={ __( 'Connect to set up brute force attack protection.', 'jetpack' ) }
						/>
					) }
				</SettingsCard>
			);
		}
	}
);
