import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import FoldableCard from 'components/foldable-card';
import { FormLegend, FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import Textarea from 'components/textarea';
import analytics from 'lib/analytics';
import { includes } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';
import { getSetting } from '../state/settings';
import { getWafIpAllowListInputState, updateWafIpAllowList } from '../state/waf';

const ProtectComponent = class extends Component {
	/**
	 * Component Did Update
	 *
	 * @param {object} prevProps - Previous component properties.
	 */
	componentDidUpdate( prevProps ) {
		// Sync the redux IP allow list input state with the component's settings state.
		if ( prevProps.allowListInputState !== this.props.allowListInputState ) {
			this.props.updateFormStateOptionValue(
				'jetpack_waf_ip_allow_list',
				this.props.allowListInputState
			);
		}
	}

	currentIpIsSafelisted = () => {
		// get current IP allow list in textarea from this.props.allowListInputState;
		return !! includes( this.props.allowListInputState, this.props.currentIp );
	};

	updateIPAllowList = event => {
		// Enable button if IP is not in the textarea
		this.currentIpIsSafelisted();
		// Update the allow list
		this.props.updateWafIpAllowList( event.target.value );
	};

	addToSafelist = () => {
		const newSafelist =
			this.props.allowListInputState +
			( 0 >= this.props.allowListInputState.length ? '' : '\n' ) +
			this.props.currentIp;

		// Update the allow list
		this.props.updateWafIpAllowList( newSafelist );

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
				saveDisabled={ this.props.isSavingAnyOption( 'jetpack_waf_ip_allow_list' ) }
			>
				{ isProtectActive && <QueryWafSettings /> }
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
							{ this.props.currentIp && (
								<div className="brute-force__current-ip">
									<div className="jp-form-label-wide">
										{ sprintf(
											/* translators: placeholder is an IP address. */
											__( 'Your current IP: %s', 'jetpack' ),
											this.props.currentIp
										) }
									</div>
									{
										<Button
											rna
											compact
											disabled={
												! isProtectActive ||
												unavailableInOfflineMode ||
												this.currentIpIsSafelisted() ||
												this.props.isSavingAnyOption( [ 'protect', 'jetpack_waf_ip_allow_list' ] )
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
									name={ 'jetpack_waf_ip_allow_list' }
									placeholder={ 'Example: 12.12.12.1-12.12.12.100' }
									onChange={ this.updateIPAllowList }
									value={ this.props.allowListInputState }
								/>
							</FormLabel>
							<span className="jp-form-setting-explanation">
								{ __(
									'You may mark an IP address (or series of addresses) as "Always allowed", preventing them from ever being blocked by Jetpack. IPv4 and IPv6 are acceptable. To specify a range, enter the low value and high value separated by a dash. Example: 12.12.12.1-12.12.12.100',
									'jetpack'
								) }
							</span>
						</SettingsGroup>
					</FoldableCard>
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export const Protect = connect(
	state => {
		const allowListInputState = getWafIpAllowListInputState( state );

		return {
			allowListInputState:
				null !== allowListInputState
					? allowListInputState
					: getSetting( state, 'jetpack_waf_ip_allow_list' ),
		};
	},
	dispatch => {
		return {
			updateWafIpAllowList: allowList => dispatch( updateWafIpAllowList( allowList ) ),
		};
	}
)( withModuleSettingsFormHelpers( ProtectComponent ) );
