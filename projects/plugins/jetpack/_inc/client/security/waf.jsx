import { getRedirectUrl, ToggleControl, Status, Text } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import FoldableCard from 'components/foldable-card';
import { FormFieldset } from 'components/forms';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import JetpackBanner from 'components/jetpack-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import {
	getJetpackProductUpsellByFeature,
	FEATURE_SECURITY_SCANNING_JETPACK,
} from 'lib/plans/constants';
import { includes } from 'lodash';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isModuleFound } from 'state/search';
import { getSitePlan, siteHasFeature } from 'state/site';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';
import InfoPopover from '../components/info-popover';
import { ModuleToggle } from '../components/module-toggle';
import Textarea from '../components/textarea';
import { getSetting } from '../state/settings/reducer';
import { updateWafSettings, updateWafIpAllowList } from '../state/waf/actions';
import {
	getAutomaticRulesAvailable,
	getWafSettings,
	getWafIpAllowListInputState,
	isFetchingWafSettings,
	isUpdatingWafSettings,
} from '../state/waf/reducer';

export const Waf = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {object}
	 */
	state = {
		automaticRulesEnabled: this.props.settings?.automaticRulesEnabled,
		ipAllowListEnabled: this.props.settings?.ipAllowListEnabled,
		ipBlockListEnabled: this.props.settings?.ipBlockListEnabled,
		ipBlockList: this.props.settings?.ipBlockList,
		ipAllowList: this.props.settings?.ipAllowList,
		shareData: this.props.settings?.shareData,
		shareDebugData: this.props.settings?.shareDebugData,
	};

	/**
	 * Keep the form values in sync with updates to the settings prop.
	 *
	 * @param {object} prevProps - Next render props.
	 */
	componentDidUpdate = prevProps => {
		// Sync the form values with the settings prop.
		if ( this.props.settings !== prevProps.settings ) {
			this.setState( {
				...this.state,
				automaticRulesEnabled: this.props.settings?.automaticRulesEnabled,
				ipAllowListEnabled: this.props.settings?.ipAllowListEnabled,
				ipBlockListEnabled: this.props.settings?.ipBlockListEnabled,
				ipBlockList: this.props.settings?.ipBlockList,
				ipAllowList: this.props.settings?.ipAllowList,
				shareData: this.props.settings?.shareData,
				shareDebugData: this.props.settings?.shareDebugData,
			} );
		}

		// Sync the allow list value with the value in redux.
		if ( prevProps.allowListInputState !== this.props.allowListInputState ) {
			this.setState( {
				...this.state,
				ipAllowList: this.props.allowListInputState,
			} );
		}
	};

	/**
	 * Get a custom error message based on the error code.
	 *
	 * @param {object} error - Error object.
	 * @returns {string|boolean} Custom error message or false if no custom message exists.
	 */
	getCustomErrorMessage = error => {
		switch ( error.code ) {
			case 'file_system_error':
				return __( 'A filesystem error occurred.', 'jetpack' );
			case 'rules_api_error':
				return __( 'An error occurred retrieving the latest automatic firewall rules.', 'jetpack' );
			default:
				return false;
		}
	};

	/**
	 * Handle settings updates.
	 *
	 * @returns {void}
	 */
	onSubmit = () => {
		this.props.removeNotice( 'module-setting-update' );
		this.props.removeNotice( 'module-setting-update-success' );

		this.props.createNotice( 'is-info', __( 'Updating settings…', 'jetpack' ), {
			id: 'module-setting-update',
		} );

		this.props
			.updateWafSettings( this.state )
			.then( () => {
				this.props.removeNotice( 'module-setting-update' );
				this.props.createNotice( 'is-success', __( 'Updated Settings.', 'jetpack' ), {
					id: 'module-setting-update-success',
				} );
			} )
			.catch( error => {
				this.props.removeNotice( 'module-setting-update' );
				this.props.createNotice(
					'is-error',
					sprintf(
						/* translators: placeholder is an error code or an error message. */
						__( 'Error updating settings. %s', 'jetpack' ),
						this.getCustomErrorMessage( error.response ) || error.message || error.code
					),
					{
						id: 'module-setting-update',
					}
				);
			} );
	};

	/**
	 * Toggle automatic rules.
	 */
	toggleAutomaticRules = () => {
		this.setState(
			{
				...this.state,
				automaticRulesEnabled: ! this.state.automaticRulesEnabled,
			},
			this.onSubmit
		);
	};

	/**
	 * Toggle IP allow list.
	 */
	toggleIpAllowList = () => {
		this.setState(
			{ ...this.state, ipAllowListEnabled: ! this.state.ipAllowListEnabled },
			this.onSubmit
		);
	};

	/**
	 * Toggle IP block list.
	 */
	toggleIpBlockList = () => {
		this.setState(
			{ ...this.state, ipBlockListEnabled: ! this.state.ipBlockListEnabled },
			this.onSubmit
		);
	};

	/**
	 * Handle IP block list change.
	 *
	 * @param {Event} event - The event object.
	 */
	handleIpBlockListChange = event => {
		this.setState( { ...this.state, ipBlockList: event?.target?.value } );
	};

	/**
	 * Handle IP allow list change.
	 *
	 * @param {Event} event - = The event object.
	 */
	handleIpAllowListChange = event => {
		this.props.updateWafIpAllowList( event.target.value );
	};

	/**
	 * Toggle share data.
	 */
	toggleShareData = () => {
		const state = {
			...this.state,
			shareData: ! this.state.shareData,
		};

		if ( ! state.shareData ) {
			state.shareDebugData = state.shareData;
		}

		this.setState( state, this.onSubmit );
	};

	/**
	 * Toggle share debug data.
	 */
	toggleShareDebugData = () => {
		const state = {
			...this.state,
			shareDebugData: ! this.state.shareDebugData,
		};

		if ( state.shareDebugData ) {
			state.shareData = state.shareDebugData;
		}

		this.setState( state, this.onSubmit );
	};

	currentIpIsSafelisted = () => {
		// get current IP allow list in textarea from this.props.allowListInputState;
		return !! includes( this.props.allowListInputState, this.props.currentIp );
	};

	addToSafelist = () => {
		const newSafelist =
			this.props.allowListInputState +
			( 0 >= this.props.allowListInputState.length ? '' : '\n' ) +
			this.props.currentIp;

		// Update the allow list
		this.props.updateWafIpAllowList( newSafelist );
	};

	render() {
		const foundWaf = this.props.isModuleFound( 'waf' );
		const isWafActive = this.props.getOptionValue( 'waf' );
		const wafUnavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'waf' );
		const isProtectActive = this.props.getOptionValue( 'protect' );
		const protectUnavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'protect' );
		const baseInputDisabledCase =
			! isWafActive ||
			wafUnavailableInOfflineMode ||
			this.props.isFetchingWafSettings ||
			this.props.isSavingAnyOption( [ 'waf' ] );

		const moduleHeader = (
			<div className="waf__header">
				{ foundWaf ? (
					<>
						<span>{ _x( 'Firewall', 'Settings header', 'jetpack' ) }</span>
						<a
							href={ getRedirectUrl( 'jetpack-support-waf' ) }
							target="_blank"
							rel="noopener noreferrer"
							className="waf__header__badge"
						>
							{ _x( 'NEW', 'Settings header badge', 'jetpack' ) }
						</a>
						{ this.props.settings?.standaloneMode && (
							<Status
								className="waf__standalone__mode"
								status="active"
								label={ __( 'Standalone mode', 'jetpack' ) }
							/>
						) }
					</>
				) : (
					<span>{ _x( 'Brute force protection', 'Settings header', 'jetpack' ) }</span>
				) }
			</div>
		);

		const automaticRulesSettings = (
			<div className="waf__settings__toggle-setting">
				<ToggleControl
					checked={
						this.props.hasScan || this.props.settings?.automaticRulesAvailable
							? this.props.settings?.automaticRulesEnabled
							: false
					}
					toggling={
						this.props.isUpdatingWafSettings &&
						this.state.automaticRulesEnabled !== this.props.settings?.automaticRulesEnabled
					}
					disabled={
						baseInputDisabledCase ||
						( ! this.props.hasScan && ! this.props.settings?.automaticRulesAvailable )
					}
					onChange={ this.toggleAutomaticRules }
					label={
						<span className="jp-form-toggle-explanation">
							{ __(
								'Automatic rules - Protect your site against untrusted traffic sources with automatic security rules',
								'jetpack'
							) }
						</span>
					}
				/>
			</div>
		);

		const shareDataSettings = (
			<div className="waf__settings__toggle-setting">
				<ToggleControl
					checked={ this.props.settings?.shareData }
					disabled={ baseInputDisabledCase }
					toggling={
						this.props.isUpdatingWafSettings &&
						this.state.shareData !== this.props.settings?.shareData
					}
					onChange={ this.toggleShareData }
					label={
						<div className="waf__settings__toggle-setting__label">
							<span className="jp-form-toggle-explanation">
								{ __( 'Share basic data with Jetpack', 'jetpack' ) }
							</span>
							<InfoPopover
								position="right"
								screenReaderText={ __( 'Learn more', 'jetpack' ) }
								className="waf__settings__share-data-popover"
							>
								{ createInterpolateElement(
									__(
										'Allow Jetpack to collect basic data from blocked requests to improve firewall protection and accuracy. <ExternalLink>Learn more</ExternalLink> <hr /> <ExternalLink>Privacy Information</ExternalLink>',
										'jetpack'
									),
									{
										ExternalLink: (
											<ExternalLink
												href={ getRedirectUrl( 'jetpack-waf-settings-privacy-info' ) }
											/>
										),
										hr: <hr />,
									}
								) }
							</InfoPopover>
						</div>
					}
				/>
			</div>
		);

		const shareDebugDataSettings = (
			<div className="waf__settings__toggle-setting">
				<ToggleControl
					checked={ this.props.settings?.shareDebugData }
					disabled={ baseInputDisabledCase }
					toggling={
						this.props.isUpdatingWafSettings &&
						this.state.shareDebugData !== this.props.settings?.shareDebugData
					}
					onChange={ this.toggleShareDebugData }
					label={
						<div className="waf__settings__toggle-setting__label">
							<span className="jp-form-toggle-explanation">
								{ __( 'Share detailed data with Jetpack', 'jetpack' ) }
							</span>
							<InfoPopover
								position="right"
								screenReaderText={ __( 'Learn more', 'jetpack' ) }
								className="waf__settings__share-data-popover"
							>
								{ createInterpolateElement(
									__(
										'Allow Jetpack to collect detailed data from blocked requests to enhance firewall protection and accuracy. <ExternalLink>Learn more</ExternalLink> <hr /> <ExternalLink>Privacy Information</ExternalLink>',
										'jetpack'
									),
									{
										ExternalLink: (
											<ExternalLink
												href={ getRedirectUrl( 'jetpack-waf-settings-privacy-info' ) }
											/>
										),
										hr: <hr />,
									}
								) }
							</InfoPopover>
						</div>
					}
				/>
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
									this.props.settings?.bootstrapPath
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
				callToAction={ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
				title={
					<>
						{ ! this.props.settings?.automaticRulesAvailable
							? __( 'Upgrade to enable automatic rules', 'jetpack' )
							: __(
									'Upgrade to keep your site secure with up-to-date firewall rules',
									'jetpack',
									/* dummy arg to avoid bad minification */ 0
							  ) }
						<InfoPopover
							position="right"
							screenReaderText={ __( 'Learn more', 'jetpack' ) }
							className="waf__settings__upgrade-popover"
						>
							{ ! this.props.settings?.automaticRulesAvailable
								? __(
										'The free version of the firewall only allows for use of manual rules.',
										'jetpack'
								  )
								: __(
										'The free version of the firewall does not receive updates to automatic firewall rules.',
										'jetpack',
										/* dummy arg to avoid bad minification */ 0
								  ) }
						</InfoPopover>
					</>
				}
				eventFeature="scan"
				plan={ getJetpackProductUpsellByFeature( FEATURE_SECURITY_SCANNING_JETPACK ) }
				feature="jetpack_scan"
				href={ this.props.scanUpgradeUrl }
				rna
			/>
		);

		const ipAllowListSettings = (
			<div className="waf__settings__toggle-setting">
				<ToggleControl
					checked={ this.props.settings?.ipAllowListEnabled }
					toggling={
						this.props.isUpdatingWafSettings &&
						this.state.ipAllowListEnabled !== this.props.settings?.ipAllowListEnabled
					}
					disabled={ ! isWafActive && ! isProtectActive }
					onChange={ this.toggleIpAllowList }
					label={
						<span className="jp-form-toggle-explanation">
							{ __( 'Always allowed IP addresses', 'jetpack' ) }
						</span>
					}
				/>
				<div className="waf__settings__ips">
					<Text mb={ 0 }>
						{ __(
							"IP addresses added to this list will never be blocked by Jetpack's security features.",
							'jetpack'
						) }
					</Text>
					<Textarea
						disabled={
							( ! isWafActive && ! isProtectActive ) ||
							this.props.isUpdatingWafSettings ||
							! this.props.settings?.ipAllowListEnabled
						}
						name="ipAllowList"
						placeholder={ __( 'Example:', 'jetpack' ) + '\n12.12.12.1\n12.12.12.2' }
						value={ this.props.allowListInputState }
						onChange={ this.handleIpAllowListChange }
					/>
					<div className="allow-list-button-container">
						{ this.props.currentIp && (
							<div className="current-ip">
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
											( ! isWafActive && ! isProtectActive ) ||
											protectUnavailableInOfflineMode ||
											this.currentIpIsSafelisted() ||
											this.props.isSavingAnyOption( [ 'protect', 'jetpack_waf_ip_allow_list' ] )
										}
										onClick={ this.addToSafelist }
									>
										{ __( 'Add to Allow List', 'jetpack' ) }
									</Button>
								}
							</div>
						) }
						<Button
							primary
							rna
							compact
							type="button"
							className="waf__settings__ips__save-button"
							disabled={
								( ! isWafActive && ! isProtectActive ) ||
								this.state.ipAllowList === this.props.settings?.ipAllowList ||
								( this.props.isUpdatingWafSettings &&
									this.state.ipAllowList !== this.props.settings?.ipAllowList )
							}
							onClick={ this.onSubmit }
						>
							{ __( 'Save allow list', 'jetpack' ) }
						</Button>
					</div>
				</div>
			</div>
		);

		const ipBlockListSettings = (
			<div className="waf__settings__toggle-setting">
				<ToggleControl
					checked={ this.props.settings?.ipBlockListEnabled }
					toggling={
						this.props.isUpdatingWafSettings &&
						this.state.ipBlockListEnabled !== this.props.settings?.ipBlockListEnabled
					}
					disabled={ baseInputDisabledCase }
					onChange={ this.toggleIpBlockList }
					label={
						<span className="jp-form-toggle-explanation">
							{ __( 'Block specific IP addresses from accessing your site', 'jetpack' ) }
						</span>
					}
				/>
				<div className="waf__settings__ips">
					<Textarea
						disabled={
							baseInputDisabledCase ||
							this.props.isUpdatingWafSettings ||
							! this.props.settings?.ipBlockListEnabled
						}
						name="ipBlockList"
						placeholder={ sprintf(
							/* translators: Placeholder is a list of example IP addresses. */
							__( 'Example: %s', 'jetpack' ),
							'\n12.12.12.1\n12.12.12.2'
						) }
						value={ this.state.ipBlockList }
						onChange={ this.handleIpBlockListChange }
					/>
					<Button
						primary
						rna
						compact
						type="button"
						className="waf__settings__ips__save-button"
						disabled={
							baseInputDisabledCase ||
							this.state.ipBlockList === this.props.settings?.ipBlockList ||
							( this.props.isUpdatingWafSettings &&
								this.state.ipBlockList !== this.props.settings?.ipBlockList )
						}
						onClick={ this.onSubmit }
					>
						{ __( 'Save block list', 'jetpack' ) }
					</Button>
				</div>
			</div>
		);

		return (
			<SettingsCard
				{ ...this.props }
				header={ moduleHeader }
				module="waf"
				onSubmit={ this.onSubmit }
				hideButton={ true }
			>
				{ ( isWafActive || isProtectActive ) && <QueryWafSettings /> }
				<SettingsGroup
					disableInOfflineMode
					module={ this.props.getModule( 'waf' ) }
					support={ {
						text: this.props.getModule( 'waf' ).long_description,
						link: this.props.getModule( 'waf' ).learn_more_button,
					} }
				>
					{ foundWaf && (
						<ModuleToggle
							slug="waf"
							disabled={ wafUnavailableInOfflineMode }
							activated={ isWafActive }
							toggling={ this.props.isSavingAnyOption( 'waf' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ this.props.getModule( 'waf' ).description }
							</span>
						</ModuleToggle>
					) }
					{ isWafActive && ! this.props.isFetchingWafSettings && (
						<FormFieldset className="waf__settings">
							{ automaticRulesSettings }
							{ shareDataSettings }
							{ shareDebugDataSettings }
						</FormFieldset>
					) }
					<ModuleToggle
						slug="protect"
						disabled={ protectUnavailableInOfflineMode }
						activated={ isProtectActive }
						toggling={ this.props.isSavingAnyOption( 'protect' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ this.props.getModule( 'protect' ).description }
						</span>
					</ModuleToggle>
					{ isWafActive && ! this.props.isFetchingWafSettings && ipBlockListSettings }
					{ ipAllowListSettings }
				</SettingsGroup>
				{ isWafActive && this.props.bootstrapPath && bootstrapInstructions }
				{ ! this.props.hasScan && ! this.props.isFetchingSettings && upgradeBanner }
			</SettingsCard>
		);
	}
};

export default connect(
	state => {
		const sitePlan = getSitePlan( state );
		const allowListInputState = getWafIpAllowListInputState( state );

		return {
			automaticRulesAvailable: getAutomaticRulesAvailable( state ),
			allowListInputState:
				allowListInputState !== null
					? allowListInputState
					: getSetting( state, 'jetpack_waf_ip_allow_list' ),
			hasScan: siteHasFeature( state, 'scan' ),
			isFetchingSettings: isFetchingWafSettings( state ),
			isUpdatingWafSettings: isUpdatingWafSettings( state ),
			settings: getWafSettings( state ),
			scanUpgradeUrl: getProductDescriptionUrl( state, 'scan' ),
			sitePlan,
			isModuleFound: module_name => isModuleFound( state, module_name ),
		};
	},
	dispatch => {
		return {
			updateWafIpAllowList: allowList => dispatch( updateWafIpAllowList( allowList ) ),
			updateWafSettings: newSettings => dispatch( updateWafSettings( newSettings ) ),
			createNotice: ( type, message, props ) => dispatch( createNotice( type, message, props ) ),
			removeNotice: notice => dispatch( removeNotice( notice ) ),
		};
	}
)( withModuleSettingsFormHelpers( Waf ) );
