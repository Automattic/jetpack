/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { FEATURE_SECURITY_SCANNING_JETPACK } from 'lib/plans/constants';
import ExternalLink from 'components/external-link';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action';
import {
	isModuleActivated as _isModuleActivated,
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';
import { getSitePlan } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';
import { isFetchingSiteData } from 'state/site';
import QueryVaultPressData from 'components/data/query-vaultpress-data';

const BackupsScan = React.createClass( {
	toggleModule( name, value ) {
		this.props.updateFormStateOptionValue( name, !value );
	},

	getNotice() {
		const hasSitePlan = false !== this.props.sitePlan,
			vpData = this.props.vaultPressData,
			inactiveOrUninstalled = this.props.isPluginInstalled( 'vaultpress/vaultpress.php' ) ? 'pro-inactive' : 'pro-uninstalled',
			scanEnabled = get( vpData, [ 'data', 'features', 'security' ], false ),
			hasPremium = /jetpack_premium*/.test( this.props.sitePlan.product_slug ),
			hasBusiness = /jetpack_business*/.test( this.props.sitePlan.product_slug );

		let status,
			text,
			link,
			icon = '';

		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			if ( vpData === 'N/A' ) {
				status = 'is-simple';
				text = __( 'Loading…' );
				link = false;
			} else if ( scanEnabled ) {
				if ( 0 !== this.props.scanThreats ) {
					status = 'is-working';
					text = __( 'Threats found!', { context: 'A message about security threats found.' } );
					link = 'https://dashboard.vaultpress.com/';
					icon = 'notice';
				} else if ( vpData.code === 'success' ) {
					status = 'is-working';
					text = __( 'All clean!', { context: 'A message about no security threats found.' } );
					link = false;
					icon = 'checkmark';
				}
			} else {
				status = 'no-pro-uninstalled-or-inactive';
				text = __( 'Inactive', { context: 'A message about the security plugin not activated yet.' } );
				icon = 'notice';
			}
		} else if ( hasPremium || hasBusiness ) {
			status = 'pro-inactive';
			text = __( 'Inactive', { context: 'A message about the security plugin not activated yet.' } );
			link = 'https://wordpress.com/plugins/vaultpress';
			icon = 'notice';
		} else if ( this.props.fetchingSiteData ) {
			status = 'is-simple';
			text = __( 'Loading…' );
			link = false;
		} else {
			status = 'no-pro-uninstalled-or-inactive';
			text = __( 'Upgrade', { context: 'Caption for a button to purchase a paid feature.' } );
			link = 'https://jetpack.com/redirect/?source=security-scan&site=' + this.props.siteRawUrl;
			icon = 'notice';
		}

		if ( ! status ) {
			return null;
		}

		return (
			<SimpleNotice
				icon={ icon }
				showDismiss={ false }
				isCompact={ true }
				status={ status }
				text={ text }>
				<QueryVaultPressData />
				{ link &&
					<NoticeAction href={ link }>
						{ __( 'FIX IT', { context: 'A caption for a small button to fix security issues.' } ) }
					</NoticeAction>
				}
			</SimpleNotice>
		);
	},

	render() {
		return (
			<SettingsCard
				feature={ FEATURE_SECURITY_SCANNING_JETPACK }
				{ ...this.props }
				header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
				hideButton
				notice={ this.getNotice() }>
				<SettingsGroup disableInDevMode module={ { module: 'backups' } } support="https://vaultpress.com/jetpack/">
					{
						! this.props.isUnavailableInDevMode( 'backups' ) && (
							<span>
								<ExternalLink className="jp-module-settings__external-link" href="https://dashboard.vaultpress.com/" >{ __( 'Configure your Security Scans' ) }</ExternalLink>
							</span>
						)
					}
				</SettingsGroup>
			</SettingsCard>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isFetchingModulesList: () => _isFetchingModulesList( state ),
			vaultPressData: _getVaultPressData( state ),
			scanThreats: _getVaultPressScanThreatCount( state ),
			sitePlan: getSitePlan( state ),
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug ),
			fetchingSiteData: isFetchingSiteData( state )
		};
	}
)( moduleSettingsForm( BackupsScan ) );
