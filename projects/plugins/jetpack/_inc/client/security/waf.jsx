import { getRedirectUrl, ToggleControl, Status } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import React, { Component } from 'react';
import { connect } from 'react-redux';
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
	PLAN_JETPACK_SCAN,
} from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { getSitePlan, siteHasFeature } from 'state/site';
import Card from '../components/card';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';
import InfoPopover from '../components/info-popover';
import { ModuleToggle } from '../components/module-toggle';
import PlanIcon from '../components/plans/plan-icon';
import Textarea from '../components/textarea';
import { getSiteAdminUrl } from '../state/initial-state';
import { isPluginActive } from '../state/site/plugins';
import { updateWafSettings } from '../state/waf/actions';
import {
	getAutomaticRulesAvailable,
	getWafSettings,
	isFetchingWafSettings,
	isUpdatingWafSettings,
} from '../state/waf/reducer';

const PROTECT_PLUGIN_FILES = [
	'protect/jetpack-protect.php',
	'jetpack-protect/jetpack-protect.php',
	'jetpack-protect-dev/jetpack-protect.php',
];

export const Waf = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @return {object}
	 */
	state = {
		automaticRulesEnabled: this.props.settings?.automaticRulesEnabled,
		ipBlockListEnabled: this.props.settings?.ipBlockListEnabled,
		ipBlockList: this.props.settings?.ipBlockList,
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
				ipBlockListEnabled: this.props.settings?.ipBlockListEnabled,
				ipBlockList: this.props.settings?.ipBlockList,
				shareData: this.props.settings?.shareData,
				shareDebugData: this.props.settings?.shareDebugData,
			} );
		}
	};

	/**
	 * Get a custom error message based on the error code.
	 *
	 * @param {object} error - Error object.
	 * @return {string|boolean} Custom error message or false if no custom message exists.
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
	 * @return {void}
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

	render() {
		const isWafActive = this.props.getOptionValue( 'waf' );
		const unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'waf' );
		const baseInputDisabledCase =
			! isWafActive ||
			unavailableInOfflineMode ||
			this.props.isFetchingWafSettings ||
			this.props.isSavingAnyOption( [ 'waf' ] );

		const moduleHeader = (
			<div className="waf__header">
				<span>{ _x( 'Firewall', 'Settings header', 'jetpack' ) }</span>
				{ this.props.settings?.standaloneMode && (
					<Status
						className="waf__standalone__mode"
						status="active"
						label={ __( 'Standalone mode', 'jetpack' ) }
					/>
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
							{ __(
								'Manual rules - Block specific IP addresses from accessing your site',
								'jetpack'
							) }
						</span>
					}
				/>
				{ ( this.state.ipBlockListEnabled || !! this.state.ipBlockList ) && (
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
						{ this.state.ipBlockListEnabled && (
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
						) }
					</div>
				) }
			</div>
		);

		// If the site has Jetpack Protect activated, redirect the user to the dedicated Protect settings screen.
		if ( this.props.isProtectActive ) {
			return (
				<SettingsCard { ...this.props } header={ moduleHeader } module="waf" hideButton={ true }>
					<Card className="dops-banner has-call-to-action">
						<div className="dops-banner__icon-plan">
							<PlanIcon plan={ PLAN_JETPACK_SCAN } />
						</div>
						<div className="dops-banner__content">
							<div className="dops-banner__info">
								<div className="dops-banner__title">
									{ __(
										'Firewall settings have been moved to the Jetpack Protect plugin.',
										'jetpack'
									) }
								</div>
							</div>
							<div className="dops-banner__action">
								<Button rna={ true } compact href={ this.props.protectAdminUrl } primary>
									{ __( 'View Firewall Settings', 'jetpack' ) }
								</Button>
							</div>
						</div>
					</Card>
				</SettingsCard>
			);
		}

		return (
			<SettingsCard
				{ ...this.props }
				header={ moduleHeader }
				module="waf"
				onSubmit={ this.onSubmit }
				hideButton={ true }
			>
				{ isWafActive && <QueryWafSettings /> }
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
					{ isWafActive && ! this.props.isFetchingWafSettings && (
						<FormFieldset className="waf__settings">
							{ automaticRulesSettings }
							{ ipBlockListSettings }
							{ shareDataSettings }
							{ shareDebugDataSettings }
						</FormFieldset>
					) }
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

		return {
			automaticRulesAvailable: getAutomaticRulesAvailable( state ),
			hasScan: siteHasFeature( state, 'scan' ),
			protectAdminUrl: `${ getSiteAdminUrl( state ) }admin.php?page=jetpack-protect#/firewall`,
			isProtectActive: PROTECT_PLUGIN_FILES.some( pluginFile =>
				isPluginActive( state, pluginFile )
			),
			getProtectUrl: `${ getSiteAdminUrl( state ) }admin.php?page=my-jetpack#/add-protect`,
			isFetchingSettings: isFetchingWafSettings( state ),
			isUpdatingWafSettings: isUpdatingWafSettings( state ),
			settings: getWafSettings( state ),
			scanUpgradeUrl: getProductDescriptionUrl( state, 'scan' ),
			sitePlan,
		};
	},
	dispatch => {
		return {
			updateWafSettings: newSettings => dispatch( updateWafSettings( newSettings ) ),
			createNotice: ( type, message, props ) => dispatch( createNotice( type, message, props ) ),
			removeNotice: notice => dispatch( removeNotice( notice ) ),
		};
	}
)( withModuleSettingsFormHelpers( Waf ) );
