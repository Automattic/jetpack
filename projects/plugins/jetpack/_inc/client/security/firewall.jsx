/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { __, _x, sprintf } from '@wordpress/i18n';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLabel } from 'components/forms';
import {
	getPlanClass,
	getJetpackProductUpsellByFeature,
	FEATURE_SECURITY_SCANNING_JETPACK,
} from 'lib/plans/constants';
import FoldableCard from 'components/foldable-card';
import JetpackBanner from 'components/jetpack-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import InfoPopover from '../components/info-popover';
import Textarea from '../components/textarea';
import { createInterpolateElement } from '@wordpress/element';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { getSitePlan } from 'state/site';
import {
	getWafBootstrapPath,
	getWafHasRulesAccess,
	isFetchingWafSettings,
} from '../state/firewall/reducer';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';

export const Firewall = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {{jetpack_firewall_ip_list: *, jetpack_firewall_share_data: *}}
	 */
	state = {
		jetpack_firewall_ip_list: this.props.getOptionValue( 'jetpack_firewall_ip_list' ),
		jetpack_firewall_ip_allow_list: this.props.getOptionValue( 'jetpack_firewall_ip_allow_list' ),
		jetpack_firewall_ip_block_list: this.props.getOptionValue( 'jetpack_firewall_ip_block_list' ),
		jetpack_firewall_share_data: this.props.getOptionValue( 'jetpack_firewall_share_data' ),
	};

	handleIpListToggleChange = () => {
		this.updateOptions( 'jetpack_firewall_ip_list' );
	};

	handleShareDataToggleChange = () => {
		this.updateOptions( 'jetpack_firewall_share_data' );
	};

	handleIpListChange = event => {
		const {
			target: { name, value },
		} = event;

		this.setState( {
			[ name ]: value,
		} );

		this.props.onOptionChange( event );
	};

	/**
	 * Update state so toggles are updated.
	 *
	 * @param {string} optionName - The slug of the option to update
	 */
	updateOptions = optionName => {
		this.setState(
			{
				[ optionName ]: ! this.state[ optionName ],
			},
			this.props.updateFormStateModuleOption( 'firewall', optionName )
		);
	};

	render() {
		const isFirewallActive = this.props.getOptionValue( 'firewall' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'firewall' );

		const moduleHeader = (
			<div className="firewall__header">
				<span>{ _x( 'Firewall', 'Settings header', 'jetpack' ) }</span>
				<span className="firewall__header__badge">
					{ _x( 'Beta', 'Settings header badge', 'jetpack' ) }
				</span>
			</div>
		);

		const ipListSettings = (
			<div className="firewall__settings__toggle-setting">
				<CompactFormToggle
					checked={ this.state.jetpack_firewall_ip_list }
					disabled={
						! isFirewallActive ||
						unavailableInOfflineMode ||
						this.props.isSavingAnyOption( [ 'firewall', 'jetpack_firewall_ip_list' ] )
					}
					onChange={ this.handleIpListToggleChange }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Allow / Block list - Block or allow a specific request IP', 'jetpack' ) }
					</span>
				</CompactFormToggle>

				{ this.state.jetpack_firewall_ip_list && (
					<>
						<div className="firewall__settings__ips">
							<FormLabel>{ __( 'Blocked IP addresses', 'jetpack' ) }</FormLabel>
							<Textarea
								disabled={
									! isFirewallActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [
										'firewall',
										'jetpack_firewall_ip_list',
										'jetpack_firewall_ip_block_list',
									] )
								}
								name="jetpack_firewall_ip_block_list"
								placeholder={ __( 'Example: 12.12.12.1-12.12.12.100', 'jetpack' ) }
								value={ this.state.jetpack_firewall_ip_block_list }
								onChange={ this.handleIpListChange }
							/>
						</div>
						<div className="firewall__settings__ips">
							<FormLabel>{ __( 'Always allowed IP addresses', 'jetpack' ) }</FormLabel>
							<Textarea
								disabled={
									! isFirewallActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [
										'firewall',
										'jetpack_firewall_ip_list',
										'jetpack_firewall_ip_allow_list',
									] )
								}
								name="jetpack_firewall_ip_allow_list"
								placeholder={ __( 'Example: 12.12.12.1-12.12.12.100', 'jetpack' ) }
								value={ this.state.jetpack_firewall_ip_allow_list }
								onChange={ this.handleIpListChange }
							/>
						</div>
					</>
				) }
			</div>
		);

		const shareDataSettings = (
			<div className="firewall__settings__toggle-setting">
				<CompactFormToggle
					checked={ this.state.jetpack_firewall_share_data }
					disabled={
						! isFirewallActive ||
						unavailableInOfflineMode ||
						this.props.isSavingAnyOption( [ 'firewall', 'jetpack_firewall_share_data' ] )
					}
					onChange={ this.handleShareDataToggleChange }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Share data with Jetpack', 'jetpack' ) }
					</span>
				</CompactFormToggle>
				<InfoPopover
					position="right"
					screenReaderText={ __( 'Learn more', 'jetpack' ) }
					className="firewall__settings__share-data-popover"
				>
					{ createInterpolateElement(
						__(
							'Allow Jetpack to collect data to improve Firewall protection and rules. <a>Learn more</a>',
							'jetpack'
						),
						{
							a: (
								<a
									href="https://jetpack.com/support/privacy/"
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						}
					) }
					<hr />
					<a href="https://jetpack.com/support/privacy/" target="_blank" rel="noopener noreferrer">
						{ __( 'Privacy information', 'jetpack' ) }
					</a>
				</InfoPopover>
			</div>
		);

		const enhanceProtectionHeader = createInterpolateElement(
			__(
				'<b>Enhance protection</b> - Learn how to configure the firewall to inspect all requests and run before WordPress initializes',
				'jetpack'
			),
			{
				b: <strong />,
			}
		);

		const bootstrapInstructions = (
			<FoldableCard header={ enhanceProtectionHeader } className="firewall__enhanced-protection">
				<SettingsGroup hasChild>
					<ul>
						<li>
							{ createInterpolateElement(
								sprintf(
									/* translators: Placeholder is the file path to the Firewall's bootstrap file. */
									__(
										'To ensure the firewall can best protect your site, please update: <code>auto_prepend_file</code> PHP directive to point to <code>%s</code> Typically this is set either in an .htaccess file or in the global PHP configuration; contact your host for further assistance.',
										'jetpack'
									),
									this.props.bootstrapPath
								),
								{
									code: <code />,
								}
							) }
						</li>
						<li>
							{ __(
								"Don't forget to undo this action when Firewall is turned off, or you uninstall Jetpack.",
								'jetpack'
							) }
						</li>
					</ul>
				</SettingsGroup>
			</FoldableCard>
		);

		const upgradeBanner = (
			<JetpackBanner
				callToAction={ __( 'Upgrade', 'jetpack' ) }
				title={ __( 'Upgrade your protection for latest rules access', 'jetpack' ) }
				eventFeature="scan"
				plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
				feature="jetpack_scan"
				href={ this.props.scanUpgradeUrl }
			/>
		);

		return (
			<SettingsCard
				{ ...this.props }
				header={ moduleHeader }
				module="firewall"
				saveDisabled={ this.props.isSavingAnyOption( [
					'jetpack_firewall_ip_allow_list',
					'jetpack_firewall_ip_block_list',
				] ) }
			>
				<QueryWafSettings />
				<SettingsGroup disableInOfflineMode module={ this.props.getModule( 'firewall' ) }>
					<ModuleToggle
						slug="firewall"
						disabled={ unavailableInOfflineMode }
						activated={ isFirewallActive }
						toggling={ this.props.isSavingAnyOption( 'firewall' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ this.props.getModule( 'firewall' ).description }
						</span>
					</ModuleToggle>

					{ isFirewallActive && (
						<FormFieldset className="firewall__settings">
							{ ipListSettings }
							{ shareDataSettings }
						</FormFieldset>
					) }
				</SettingsGroup>
				{ isFirewallActive && this.props.bootstrapPath && bootstrapInstructions }
				{ ! this.props.hasRulesAccess && ! this.props.isFetchingWafSettings && upgradeBanner }
			</SettingsCard>
		);
	}
};

export default connect( state => {
	const sitePlan = getSitePlan( state );

	return {
		bootstrapPath: getWafBootstrapPath( state ),
		hasRulesAccess: getWafHasRulesAccess( state ),
		isFetchingWafSettings: isFetchingWafSettings( state ),
		planClass: getPlanClass( get( sitePlan, 'product_slug', '' ) ),
		scanUpgradeUrl: getProductDescriptionUrl( state, 'scan' ),
		sitePlan,
	};
} )( withModuleSettingsFormHelpers( Firewall ) );
