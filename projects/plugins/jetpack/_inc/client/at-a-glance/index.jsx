import { PartnerCouponRedeem } from '@automattic/jetpack-partner-coupon';
import { __ } from '@wordpress/i18n';
import DashSectionHeader from 'components/dash-section-header';
import QueryRecommendationsData from 'components/data/query-recommendations-data';
import QueryScanStatus from 'components/data/query-scan-status';
import QuerySite from 'components/data/query-site';
import QuerySitePlugins from 'components/data/query-site-plugins';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import analytics from 'lib/analytics';
import { chunk, get } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode, hasConnectedOwner, getConnectionStatus } from 'state/connection';
import {
	isAtomicSite,
	getApiNonce,
	getApiRootUrl,
	getPartnerCoupon,
	getPluginBaseUrl,
	getRegistrationNonce,
	getTracksUserData,
	isMultisite,
	userCanManageModules,
	userCanManagePlugins,
	userCanViewStats,
	userIsSubscriber,
} from 'state/initial-state';
import { getModuleOverride } from 'state/modules';
import { getScanStatus, isFetchingScanStatus } from 'state/scan';
import DashActivity from './activity';
import DashAkismet from './akismet';
import DashBackups from './backups';
import DashBlocks from './blocks';
import DashBoost from './boost';
import DashConnections from './connections';
import DashCRM from './crm';
import DashMonitor from './monitor';
import DashPhoton from './photon';
import DashProtect from './protect';
import DashScan from './scan';
import DashSearch from './search';
import DashSecurityBundle from './security-bundle';
import DashStats from './stats/index.jsx';
import DashVideoPress from './videopress';

class AtAGlance extends Component {
	trackSecurityClick = () => analytics.tracks.recordJetpackClick( 'aag_manage_security_wpcom' );

	trackUpgradeButtonView = ( feature = '' ) => {
		return () => analytics.tracks.recordEvent( `jetpack_wpa_aag_upgrade_button_view`, { feature } );
	};

	render() {
		const settingsProps = {
			updateOptions: this.props.updateOptions,
			getOptionValue: this.props.getOptionValue,
			isUpdating: this.props.isUpdating,
			multisite: this.props.multisite,
		};
		const urls = {
			siteAdminUrl: this.props.siteAdminUrl,
			siteRawUrl: this.props.siteRawUrl,
		};
		const securityHeader = (
			<DashSectionHeader
				label={ __( 'Security', 'jetpack' ) }
				settingsPath={ this.props.userCanManageModules ? '#security' : undefined }
				externalLink={
					this.props.isOfflineMode || ! this.props.userCanManageModules
						? ''
						: __( 'Manage security settings', 'jetpack' )
				}
				externalLinkPath={ this.props.isOfflineMode ? '' : '#/security' }
				externalLinkClick={ this.trackSecurityClick }
			/>
		);
		const connections = (
			<div>
				<DashSectionHeader
					label={ __( 'Connections', 'jetpack' ) }
					className="jp-dash-section-header__connections"
				/>
				<DashConnections />
			</div>
		);
		// Status can be unavailable, active, provisioning, awaiting_credentials
		const rewindStatus = get( this.props.rewindStatus, [ 'state' ], '' );
		const rewindStatusReason = get( this.props.rewindStatus, [ 'reason' ], '' );
		const securityCards = [];

		// Backup won't work with multi-sites, but Scan does if VaultPress is enabled
		const hasVaultPressScanning =
			! this.props.fetchingScanStatus && this.props.scanStatus?.reason === 'vp_active_on_site';
		if ( ! this.props.isAtomicSite && ( ! this.props.multisite || hasVaultPressScanning ) ) {
			securityCards.push(
				<DashScan
					{ ...settingsProps }
					{ ...urls }
					trackUpgradeButtonView={ this.trackUpgradeButtonView( 'scan' ) }
				/>
			);
		}

		securityCards.push(
			<DashAkismet
				{ ...urls }
				trackUpgradeButtonView={ this.trackUpgradeButtonView( 'akismet' ) }
			/>
		);

		if ( 'inactive' !== this.props.getModuleOverride( 'protect' ) ) {
			securityCards.push( <DashProtect { ...settingsProps } /> );
		}
		if ( 'inactive' !== this.props.getModuleOverride( 'monitor' ) ) {
			securityCards.push( <DashMonitor { ...settingsProps } /> );
		}

		// Maybe add the rewind card
		'active' === rewindStatus &&
			securityCards.unshift(
				<DashActivity { ...settingsProps } siteRawUrl={ this.props.siteRawUrl } />
			);

		// If user can manage modules, we're in an admin view, otherwise it's a non-admin view.
		if ( this.props.userCanManageModules ) {
			const canDisplaybundleCard =
				! this.props.multisite && ! this.props.isOfflineMode && this.props.hasConnectedOwner;
			const performanceCards = [];
			if ( 'inactive' !== this.props.getModuleOverride( 'photon' ) ) {
				performanceCards.push( <DashPhoton { ...settingsProps } /> );
			}
			if ( 'inactive' !== this.props.getModuleOverride( 'search' ) ) {
				performanceCards.push(
					<DashSearch
						{ ...settingsProps }
						trackUpgradeButtonView={ this.trackUpgradeButtonView( 'search' ) }
					/>
				);
			}
			if ( 'inactive' !== this.props.getModuleOverride( 'videopress' ) ) {
				performanceCards.push(
					<DashVideoPress
						{ ...settingsProps }
						trackUpgradeButtonView={ this.trackUpgradeButtonView( 'videopress' ) }
					/>
				);
			}

			if ( this.props.userCanManagePlugins ) {
				performanceCards.push(
					<DashBoost siteAdminUrl={ this.props.siteAdminUrl } />,
					<DashCRM siteAdminUrl={ this.props.siteAdminUrl } />
				);
			}

			// Add Blocks card.
			performanceCards.push( <DashBlocks /> );

			const redeemPartnerCoupon = ! this.props.isOfflineMode && this.props.partnerCoupon && (
				<PartnerCouponRedeem
					apiNonce={ this.props.apiNonce }
					registrationNonce={ this.props.registrationNonce }
					apiRoot={ this.props.apiRoot }
					assetBaseUrl={ this.props.pluginBaseUrl }
					connectionStatus={ this.props.connectionStatus }
					partnerCoupon={ this.props.partnerCoupon }
					siteRawUrl={ this.props.siteRawUrl }
					tracksUserData={ !! this.props.tracksUserData }
					analytics={ analytics }
				/>
			);

			const pinnedBundle = canDisplaybundleCard ? (
				<div className="jp-at-a-glance__pinned-bundle">
					<DashSecurityBundle />
					<DashBackups
						{ ...settingsProps }
						siteRawUrl={ this.props.siteRawUrl }
						rewindStatus={ rewindStatus }
						rewindStatusReason={ rewindStatusReason }
						trackUpgradeButtonView={ this.trackUpgradeButtonView( 'backups' ) }
					/>
				</div>
			) : null;

			return (
				<div className="jp-at-a-glance">
					<h1 className="screen-reader-text">
						{ __( 'Jetpack At A Glance Dashboard', 'jetpack' ) }
					</h1>
					<QuerySitePlugins />
					<QuerySite />
					<QueryRecommendationsData />
					<QueryScanStatus />
					{ redeemPartnerCoupon }
					<DashStats { ...settingsProps } { ...urls } />
					<Section
						header={ securityHeader }
						cards={ securityCards }
						pinnedBundle={ pinnedBundle }
					/>
					<Section
						header={ <DashSectionHeader label={ __( 'Performance and Growth', 'jetpack' ) } /> }
						cards={ performanceCards }
					/>
					{ connections }
				</div>
			);
		}

		/*
		 * Non-admin zone...
		 */
		let stats = '';
		if ( this.props.userCanViewStats ) {
			stats = <DashStats { ...settingsProps } { ...urls } />;
		}

		const protect = <DashProtect { ...settingsProps } />;
		const showSecurity = this.props.getOptionValue( 'protect' ) && this.props.hasConnectedOwner;

		return this.props.userIsSubscriber ? (
			<div>
				{ stats }
				{ connections }
			</div>
		) : (
			<div>
				{ stats }
				{ showSecurity && securityHeader }
				{ showSecurity && protect }
				{ connections }
			</div>
		);
	} // render
}

export default connect( state => {
	return {
		userCanManageModules: userCanManageModules( state ),
		userCanViewStats: userCanViewStats( state ),
		userCanManagePlugins: userCanManagePlugins( state ),
		userIsSubscriber: userIsSubscriber( state ),
		isAtomicSite: isAtomicSite( state ),
		isOfflineMode: isOfflineMode( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
		multisite: isMultisite( state ),
		scanStatus: getScanStatus( state ),
		fetchingScanStatus: isFetchingScanStatus( state ),
		hasConnectedOwner: hasConnectedOwner( state ),
		connectionStatus: getConnectionStatus( state ),
		partnerCoupon: getPartnerCoupon( state ),
		pluginBaseUrl: getPluginBaseUrl( state ),
		tracksUserData: getTracksUserData( state ),
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		registrationNonce: getRegistrationNonce( state ),
	};
} )( withModuleSettingsFormHelpers( AtAGlance ) );

const Section = ( { cards = [], header, pinnedBundle } ) => {
	if ( ! cards.length ) {
		return null;
	}
	return (
		<>
			{ header }
			{ pinnedBundle }
			{ chunk( cards, 2 ).map( ( [ left, right ], cardIndex ) => (
				<div className="jp-at-a-glance__item-grid" key={ `card-${ cardIndex }` }>
					<div className="jp-at-a-glance__left">{ left }</div>
					<div className="jp-at-a-glance__right">{ right }</div>
				</div>
			) ) }
		</>
	);
};
