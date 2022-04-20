/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import { isOfflineMode, isUnavailableInOfflineMode, hasConnectedOwner } from 'state/connection';
import { getVaultPressData } from 'state/at-a-glance';
import { isModuleFound } from 'state/search';
import { isPluginActive, isPluginInstalled } from 'state/site/plugins';
import QuerySite from 'components/data/query-site';
import QueryAkismetKeyCheck from 'components/data/query-akismet-key-check';
import { hasActiveSiteFeature } from 'state/site';
import BackupsScan from './backups-scan';
import Antispam from './antispam';
import { JetpackBackup } from './jetpack-backup';
import { Monitor } from './monitor';
import Waf from './waf';
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
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			rewindStatus: this.props.rewindStatus,
			siteRawUrl: this.props.siteRawUrl,
			hasConnectedOwner: this.props.hasConnectedOwner,
		};

		const foundWaf = this.props.isModuleFound( 'waf' ),
			foundProtect = this.props.isModuleFound( 'protect' ),
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

		const backupsContent = this.props.backupsOnly ? (
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
							? __( 'Security', 'jetpack' )
							: __(
									'Your site is protected by Jetpack. You’ll be notified if anything needs attention.',
									'jetpack',
									/* dummy arg to avoid bad minification */ 0
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
				{ foundWaf && <Waf { ...commonProps } /> }
				{ foundProtect && <Protect { ...commonProps } /> }
				{ foundSso && <SSO { ...commonProps } /> }
			</div>
		);
	}
}

export default connect( state => {
	return {
		backupsOnly:
			hasActiveSiteFeature( state, 'backups' ) && ! hasActiveSiteFeature( state, 'scan' ),
		module: module_name => getModule( state, module_name ),
		settings: getSettings( state ),
		isOfflineMode: isOfflineMode( state ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		isPluginActive: plugin_slug => isPluginActive( state, plugin_slug ),
		isPluginInstalled: plugin_slug => isPluginInstalled( state, plugin_slug ),
		vaultPressData: getVaultPressData( state ),
		hasConnectedOwner: hasConnectedOwner( state ),
	};
} )( Security );
