import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import FoldableCard from 'components/foldable-card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLabel } from 'components/forms';
import JetpackBanner from 'components/jetpack-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import {
	getJetpackProductUpsellByFeature,
	FEATURE_SECURITY_SCANNING_JETPACK,
} from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getSitePlan } from 'state/site';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';
import InfoPopover from '../components/info-popover';
import Textarea from '../components/textarea';
import {
	getWafBootstrapPath,
	getWafHasRulesAccess,
	isFetchingWafSettings,
} from '../state/waf/reducer';

export const Waf = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {{jetpack_waf_ip_list: *, jetpack_waf_share_data: *}}
	 */
	state = {
		jetpack_waf_ip_list: this.props.getOptionValue( 'jetpack_waf_ip_list' ),
		jetpack_waf_ip_allow_list: this.props.getOptionValue( 'jetpack_waf_ip_allow_list' ),
		jetpack_waf_ip_block_list: this.props.getOptionValue( 'jetpack_waf_ip_block_list' ),
		jetpack_waf_share_data: this.props.getOptionValue( 'jetpack_waf_share_data' ),
	};

	handleIpListToggleChange = () => {
		this.updateOptions( 'jetpack_waf_ip_list' );
	};

	handleShareDataToggleChange = () => {
		this.updateOptions( 'jetpack_waf_share_data' );
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
			this.props.updateFormStateModuleOption( 'waf', optionName )
		);
	};

	render() {
		const isWafActive = this.props.getOptionValue( 'waf' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'waf' );

		const moduleHeader = (
			<div className="waf__header">
				<span>{ _x( 'Firewall', 'Settings header', 'jetpack' ) }</span>
				<a
					href={ getRedirectUrl( 'jetpack-support-waf' ) }
					target="_blank"
					rel="noopener noreferrer"
					className="waf__header__badge"
				>
					{ _x( 'Beta', 'Settings header badge', 'jetpack' ) }
				</a>
			</div>
		);

		const ipListSettings = (
			<div className="waf__settings__toggle-setting">
				<CompactFormToggle
					checked={ this.state.jetpack_waf_ip_list }
					disabled={
						! isWafActive ||
						unavailableInOfflineMode ||
						this.props.isSavingAnyOption( [ 'waf', 'jetpack_waf_ip_list' ] )
					}
					onChange={ this.handleIpListToggleChange }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Allow / Block list - Block or allow a specific request IP', 'jetpack' ) }
					</span>
				</CompactFormToggle>

				{ this.state.jetpack_waf_ip_list && (
					<>
						<div className="waf__settings__ips">
							<FormLabel>{ __( 'Blocked IP addresses', 'jetpack' ) }</FormLabel>
							<Textarea
								disabled={
									! isWafActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [
										'waf',
										'jetpack_waf_ip_list',
										'jetpack_waf_ip_block_list',
									] )
								}
								name="jetpack_waf_ip_block_list"
								placeholder={ sprintf(
									/* translators: Placeholder is a list of example IP addresses. */
									__( 'Example: %s', 'jetpack' ),
									'\n12.12.12.1\n12.12.12.2'
								) }
								value={ this.state.jetpack_waf_ip_block_list }
								onChange={ this.handleIpListChange }
							/>
						</div>
						<div className="waf__settings__ips">
							<FormLabel>{ __( 'Always allowed IP addresses', 'jetpack' ) }</FormLabel>
							<Textarea
								disabled={
									! isWafActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [
										'waf',
										'jetpack_waf_ip_list',
										'jetpack_waf_ip_allow_list',
									] )
								}
								name="jetpack_waf_ip_allow_list"
								placeholder={ __( 'Example:', 'jetpack' ) + '\n12.12.12.1\n12.12.12.2' }
								value={ this.state.jetpack_waf_ip_allow_list }
								onChange={ this.handleIpListChange }
							/>
						</div>
					</>
				) }
			</div>
		);

		const shareDataSettings = (
			<div className="waf__settings__toggle-setting">
				<CompactFormToggle
					checked={ this.state.jetpack_waf_share_data }
					disabled={
						! isWafActive ||
						unavailableInOfflineMode ||
						this.props.isSavingAnyOption( [ 'waf', 'jetpack_waf_share_data' ] )
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
					className="waf__settings__share-data-popover"
				>
					{ createInterpolateElement(
						__(
							'Allow Jetpack to collect data to improve Firewall protection and rules. <ExternalLink>Learn more</ExternalLink> <hr /> <ExternalLink>Privacy Information</ExternalLink>',
							'jetpack'
						),
						{
							ExternalLink: (
								<ExternalLink href={ getRedirectUrl( 'jetpack-waf-settings-privacy-info' ) } />
							),
							hr: <hr />,
						}
					) }
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
			<FoldableCard header={ enhanceProtectionHeader } className="waf__enhanced-protection">
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
								"Don't forget to undo this action when Firewall is turned off, or when you uninstall Jetpack.",
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
				title={
					<>
						{ __( 'Your site is not receiving the latest updates to Firewall rules', 'jetpack' ) }
						<InfoPopover
							position="right"
							screenReaderText={ __( 'Learn more', 'jetpack' ) }
							className="waf__settings__upgrade-popover"
						>
							{ __(
								'Upgrade your protection to keep your site secure from the latest malicious requests with up-to-date firewall rules.',
								'jetpack'
							) }
						</InfoPopover>
					</>
				}
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
				module="waf"
				saveDisabled={ this.props.isSavingAnyOption( [
					'jetpack_waf_ip_allow_list',
					'jetpack_waf_ip_block_list',
				] ) }
			>
				<QueryWafSettings />
				<SettingsGroup
					disableInOfflineMode
					module={ this.props.getModule( 'waf' ) }
					support={ {
						text: this.props.getModule( 'waf' ).long_description,
						link: this.props.getModule( 'waf' ).learn_more_button,
					} }
				>
					<ModuleToggle
						slug="waf"
						disabled={ unavailableInOfflineMode }
						activated={ isWafActive }
						toggling={ this.props.isSavingAnyOption( 'waf' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ this.props.getModule( 'waf' ).description }
						</span>
					</ModuleToggle>

					{ isWafActive && (
						<FormFieldset className="waf__settings">
							{ ipListSettings }
							{ shareDataSettings }
						</FormFieldset>
					) }
				</SettingsGroup>
				{ isWafActive && this.props.bootstrapPath && bootstrapInstructions }
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
		scanUpgradeUrl: getProductDescriptionUrl( state, 'scan' ),
		sitePlan,
	};
} )( withModuleSettingsFormHelpers( Waf ) );
