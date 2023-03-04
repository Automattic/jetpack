import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import FoldableCard from 'components/foldable-card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FormFieldset, FormLabel } from 'components/forms';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import JetpackBanner from 'components/jetpack-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import {
	getJetpackProductUpsellByFeature,
	FEATURE_SECURITY_SCANNING_JETPACK,
} from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getSitePlan, siteHasFeature } from 'state/site';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';
import InfoPopover from '../components/info-popover';
import { ModuleToggle } from '../components/module-toggle';
import Textarea from '../components/textarea';
import { updateWafSettings } from '../state/waf/actions';
import { getWafSettings, isFetchingWafSettings, isUpdatingWafSettings } from '../state/waf/reducer';
export const Waf = class extends Component {
	/**
	 * Get options for initial state.
	 *
	 * @returns {object}
	 */
	state = {
		automaticRulesEnabled: this.props.settings?.automaticRulesEnabled,
		manualRulesEnabled: this.props.settings?.manualRulesEnabled,
		ipBlockList: this.props.settings?.ipBlockList,
		ipAllowList: this.props.settings?.ipAllowList,
		shareData: this.props.settings?.shareData,
	};

	/**
	 * Keep the form values in sync with updates to the settings prop.
	 *
	 * @param {object} prevProps - Next render props.
	 */
	componentDidUpdate = prevProps => {
		if ( this.props.settings !== prevProps.settings ) {
			this.setState( {
				automaticRulesEnabled: this.props.settings?.automaticRulesEnabled,
				manualRulesEnabled: this.props.settings?.manualRulesEnabled,
				ipBlockList: this.props.settings?.ipBlockList,
				ipAllowList: this.props.settings?.ipAllowList,
				shareData: this.props.settings?.shareData,
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
	 * Toggle manual rules.
	 */
	toggleManualRules = () => {
		this.setState(
			{ ...this.state, manualRulesEnabled: ! this.state.manualRulesEnabled },
			this.onSubmit
		);
	};

	/**
	 * Handle IP list change.
	 *
	 * @param {Event} event - The event object.
	 */
	handleIpListChange = event => {
		const {
			target: { name, value },
		} = event;

		this.setState( {
			...this.state,
			[ name ]: value,
		} );
	};

	/**
	 * Toggle share data.
	 */
	toggleShareData = () => {
		this.setState(
			{
				...this.state,
				shareData: ! this.state.shareData,
			},
			this.onSubmit
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

		const automaticRulesSettings = (
			<div className="waf__settings__toggle-setting">
				<CompactFormToggle
					checked={
						this.props.hasScan || this.props.settings.automaticRulesAvailable
							? this.state.automaticRulesEnabled
							: false
					}
					disabled={
						! isWafActive ||
						( ! this.props.hasScan && ! this.props.settings.automaticRulesAvailable ) ||
						unavailableInOfflineMode ||
						this.props.isSavingAnyOption( [ 'waf' ] ) ||
						( this.props.isUpdatingWafSettings &&
							this.state.automaticRulesEnabled !== this.props.settings.automaticRulesEnabled )
					}
					onChange={ this.toggleAutomaticRules }
				>
					<span className="jp-form-toggle-explanation">
						{ __(
							'Automatic rules - Protect your site against untrusted traffic sources with automatic security rules',
							'jetpack'
						) }
					</span>
				</CompactFormToggle>
			</div>
		);

		const ipListSettings = (
			<div className="waf__settings__toggle-setting">
				<CompactFormToggle
					checked={ this.state.manualRulesEnabled }
					disabled={
						! isWafActive ||
						unavailableInOfflineMode ||
						this.props.isSavingAnyOption( [ 'waf' ] ) ||
						( this.props.isUpdatingWafSettings &&
							this.state.manualRulesEnabled !== this.props.settings.manualRulesEnabled )
					}
					onChange={ this.toggleManualRules }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Allow / Block list - Block or allow a specific request IP', 'jetpack' ) }
					</span>
				</CompactFormToggle>

				{ this.state.manualRulesEnabled && (
					<>
						<div className="waf__settings__ips">
							<FormLabel>{ __( 'Blocked IP addresses', 'jetpack' ) }</FormLabel>
							<Textarea
								disabled={
									! isWafActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'waf' ] ) ||
									( this.props.isUpdatingWafSettings &&
										this.state.ipBlockList !== this.props.settings.ipBlockList )
								}
								name="ipBlockList"
								placeholder={ sprintf(
									/* translators: Placeholder is a list of example IP addresses. */
									__( 'Example: %s', 'jetpack' ),
									'\n12.12.12.1\n12.12.12.2'
								) }
								value={ this.state.ipBlockList }
								onChange={ this.handleIpListChange }
							/>
							<Button
								primary
								compact
								type="button"
								className="waf__settings__ips__save-button"
								disabled={
									this.state.ipBlockList === this.props.settings.ipBlockList ||
									! isWafActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'waf' ] ) ||
									( this.props.isUpdatingWafSettings &&
										this.state.ipBlockList !== this.props.settings.ipBlockList )
								}
								onClick={ this.onSubmit }
							>
								{ __( 'Save block list', 'jetpack' ) }
							</Button>
						</div>
						<div className="waf__settings__ips">
							<FormLabel>{ __( 'Always allowed IP addresses', 'jetpack' ) }</FormLabel>
							<Textarea
								disabled={
									! isWafActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'waf' ] ) ||
									( this.props.isUpdatingWafSettings &&
										this.state.ipAllowList !== this.props.settings.ipAllowList )
								}
								name="ipAllowList"
								placeholder={ __( 'Example:', 'jetpack' ) + '\n12.12.12.1\n12.12.12.2' }
								value={ this.state.ipAllowList }
								onChange={ this.handleIpListChange }
							/>
							<Button
								primary
								compact
								type="button"
								className="waf__settings__ips__save-button"
								disabled={
									this.state.ipAllowList === this.props.settings.ipAllowList ||
									! isWafActive ||
									unavailableInOfflineMode ||
									this.props.isSavingAnyOption( [ 'waf' ] ) ||
									( this.props.isUpdatingWafSettings &&
										this.state.ipAllowList !== this.props.settings.ipAllowList )
								}
								onClick={ this.onSubmit }
							>
								{ __( 'Save allow list', 'jetpack' ) }
							</Button>
						</div>
					</>
				) }
			</div>
		);

		const shareDataSettings = (
			<div className="waf__settings__toggle-setting">
				<CompactFormToggle
					checked={ this.state.shareData }
					disabled={
						! isWafActive ||
						unavailableInOfflineMode ||
						this.props.isSavingAnyOption( [ 'waf' ] ) ||
						( this.props.isUpdatingWafSettings &&
							this.state.shareData !== this.props.settings.shareData )
					}
					onChange={ this.toggleShareData }
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
									this.props.settings.bootstrapPath
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
						{ ! this.props.settings.automaticRulesAvailable
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
							{ ! this.props.settings.automaticRulesAvailable
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
			/>
		);

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

					{ isWafActive && (
						<FormFieldset className="waf__settings">
							{ automaticRulesSettings }
							{ ipListSettings }
							{ shareDataSettings }
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
			hasScan: siteHasFeature( state, 'scan' ),
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
