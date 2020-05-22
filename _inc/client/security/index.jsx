/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import { isDevMode, isUnavailableInDevMode } from 'state/connection';
import { getVaultPressData } from 'state/at-a-glance';
import { isModuleFound } from 'state/search';
import { isPluginActive, isPluginInstalled } from 'state/site/plugins';
import QuerySite from 'components/data/query-site';
import QueryAkismetKeyCheck from 'components/data/query-akismet-key-check';
import { getPlanClass } from 'lib/plans/constants';
import { getActiveSitePurchases, getSitePlan } from 'state/site';
import BackupsScan from './backups-scan';
import Antispam from './antispam';
import { JetpackBackup } from './jetpack-backup';
import { ManagePlugins } from './manage-plugins';
import { Monitor } from './monitor';
import { Protect } from './protect';
import { SSO } from './sso';

export class Security extends Component {
	static displayName = 'SecuritySettings';

	/**
	 * Check if Akismet plugin is being searched and matched.
	 *
	 * @returns {boolean} False if the plugin is inactive or if the search doesn't match it. True otherwise.
	 */
	isAkismetFound = () => {
		if ( ! this.props.isPluginActive( 'akismet/akismet.php' ) ) {
			return false;
		}

		if ( this.props.searchTerm ) {
			const akismetData = this.props.isPluginInstalled( 'akismet/akismet.php' );
			return (
				[
					'akismet',
					'antispam',
					'spam',
					'comments',
					akismetData.Description,
					akismetData.PluginURI,
				]
					.join( ' ' )
					.toLowerCase()
					.indexOf( this.props.searchTerm.toLowerCase() ) > -1
			);
		}

		return true;
	};

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode,
			rewindStatus: this.props.rewindStatus,
			siteRawUrl: this.props.siteRawUrl,
		};

		const foundProtect = this.props.isModuleFound( 'protect' ),
			foundSso = this.props.isModuleFound( 'sso' ),
			foundAkismet = this.isAkismetFound(),
			rewindActive = 'active' === get( this.props.rewindStatus, [ 'state' ], false ),
			foundBackups = this.props.isModuleFound( 'vaultpress' ) || rewindActive,
			foundMonitor = this.props.isModuleFound( 'monitor' ),
			isSearchTerm = this.props.searchTerm;

		if ( ! isSearchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! foundSso && ! foundProtect && ! foundAkismet && ! foundBackups && ! foundMonitor ) {
			return null;
		}

		const planClass = getPlanClass( get( this.props.sitePlan, [ 'product_slug' ] ) );
		const activePlanClasses = this.props.activeSitePurchases.map( purchase =>
			getPlanClass( purchase.product_slug )
		);

		const isPersonalPlan = 'is-personal-plan' === planClass;
		const isFreePlanWithBackup =
			'is-free-plan' === planClass &&
			( activePlanClasses.includes( 'is-daily-backup-plan' ) ||
				activePlanClasses.includes( 'is-realtime-backup-plan' ) );

		const backupsOnly = isPersonalPlan || isFreePlanWithBackup;

		const backupsContent = backupsOnly ? (
			<JetpackBackup { ...commonProps } vaultPressData={ this.props.vaultPressData } />
		) : (
			<BackupsScan { ...commonProps } />
		);

		return (
			<div>
				<QuerySite />
				<Card
					title={
						isSearchTerm
							? __( 'Security' )
							: __(
									'Your site is protected by Jetpack. You’ll be notified if anything needs attention.'
							  )
					}
					className="jp-settings-description"
				/>
				{ foundBackups && backupsContent }
				{ foundMonitor && <Monitor { ...commonProps } /> }
				{ foundAkismet && (
					<>
						<Antispam { ...commonProps } />
						<QueryAkismetKeyCheck />
					</>
				) }
				{ ! isSearchTerm && <ManagePlugins { ...commonProps } /> }
				{ foundProtect && <Protect { ...commonProps } /> }
				{ foundSso && <SSO { ...commonProps } /> }
			</div>
		);
	}
}

export default connect( state => {
	return {
		activeSitePurchases: getActiveSitePurchases( state ),
		module: module_name => getModule( state, module_name ),
		settings: getSettings( state ),
		sitePlan: getSitePlan( state ),
		isDevMode: isDevMode( state ),
		isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		isPluginActive: plugin_slug => isPluginActive( state, plugin_slug ),
		isPluginInstalled: plugin_slug => isPluginInstalled( state, plugin_slug ),
		vaultPressData: getVaultPressData( state ),
	};
} )( Security );
