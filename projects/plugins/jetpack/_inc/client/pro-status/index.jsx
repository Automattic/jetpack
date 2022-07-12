import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _n, _x } from '@wordpress/i18n';
import Button from 'components/button';
import QueryAkismetKeyCheck from 'components/data/query-akismet-key-check';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import SimpleNotice from 'components/notice';
import analytics from 'lib/analytics';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
	getVaultPressScanThreatCount,
	getVaultPressData,
	isFetchingVaultPressData,
	getAkismetData,
	isAkismetKeyValid,
	isFetchingAkismetData,
} from 'state/at-a-glance';
import { isOfflineMode } from 'state/connection';
import { getSiteRawUrl, getSiteAdminUrl } from 'state/initial-state';
import { getRewindStatus } from 'state/rewind';
import { getScanStatus } from 'state/scan';
import { getSitePlan, siteHasFeature, isFetchingSiteData } from 'state/site';
import { isFetchingPluginsData, isPluginActive, isPluginInstalled } from 'state/site/plugins';

/**
 * Track click on Pro status badge.
 *
 * @param {string} type    Status of a certain feature.
 * @param {string} feature Slug of plugin or service.
 *
 * @returns {undefined}
 */
const trackProStatusClick = ( type, feature ) =>
	analytics.tracks.recordJetpackClick( {
		target: 'pro-status',
		type: type,
		feature: feature,
	} );

/**
 * Build function to pass as onClick property.
 *
 * @param {string} type    Status of a certain feature.
 * @param {string} feature Slug of plugin or service.
 *
 * @returns {function} Function to track a click.
 */
const handleClickForTracking = ( type, feature ) => () => trackProStatusClick( type, feature );

class ProStatus extends React.Component {
	static propTypes = {
		isCompact: PropTypes.bool,
		proFeature: PropTypes.string,

		// Connected
		rewindStatus: PropTypes.object.isRequired,
	};

	static defaultProps = {
		isCompact: true,
		proFeature: '',
	};

	getRewindMessage() {
		switch ( this.props.rewindStatus.state ) {
			case 'provisioning':
				return {
					status: 'is-info',
					text: __( 'Setting up', 'jetpack' ),
				};
			case 'awaiting_credentials':
				return {
					status: 'is-warning',
					text: __( 'Action needed', 'jetpack' ),
				};
			case 'active':
				return {
					status: 'is-success',
					text: __( 'Connected', 'jetpack' ),
				};
			default:
				return { status: '', text: '' };
		}
	}

	getProActions = ( type, feature ) => {
		let status = '',
			message = false,
			action = false,
			actionUrl = '';
		switch ( type ) {
			case 'threats':
				status = 'is-error';
				if ( this.props.isCompact ) {
					action = _x(
						'Threats',
						'A caption for a small button to fix security issues.',
						'jetpack'
					);
				} else {
					action = _x(
						'See threats',
						'A caption for a small button to fix security issues.',
						'jetpack'
					);
				}
				actionUrl = getRedirectUrl( 'vaultpress-dashboard' );
				break;
			case 'secure':
				status = 'is-success';
				message = _x(
					'Secure',
					'Short message informing user that the site is secure.',
					'jetpack'
				);
				break;
			case 'invalid_key':
				return;
			case 'rewind_connected':
				const rewindMessage = this.getRewindMessage();
				return (
					<SimpleNotice showDismiss={ false } status={ rewindMessage.status } isCompact>
						{ rewindMessage.text }
					</SimpleNotice>
				);
			case 'active':
				return <span className="jp-dash-item__active-label">{ __( 'ACTIVE', 'jetpack' ) }</span>;
		}
		return (
			<SimpleNotice showDismiss={ false } status={ status } isCompact={ true }>
				{ message }
				{ action && (
					<a
						className="dops-notice__text-no-underline"
						onClick={ handleClickForTracking( type, feature ) }
						href={ actionUrl }
					>
						{ action }
					</a>
				) }
			</SimpleNotice>
		);
	};

	/**
	 * Return a button to Set Up a feature.
	 *
	 * @param {string} feature Slug of the feature to set up.
	 *
	 * @return {component} A Button component.
	 */
	getSetUpButton = feature => {
		return (
			<Button
				onClick={ handleClickForTracking( 'set_up', feature ) }
				compact={ true }
				primary={ true }
				href={ getRedirectUrl( 'calypso-plugins-setup', {
					site: this.props.siteRawUrl,
					query: `only=${ feature }`,
				} ) }
			>
				{ _x( 'Set up', 'Caption for a button to set up a feature.', 'jetpack' ) }
			</Button>
		);
	};

	render() {
		const { purchasedVaultPressBackups, purchasedVaultPressScan, scanStatus } = this.props;
		const sitePlan = this.props.sitePlan,
			vpData = this.props.getVaultPressData();
		let pluginSlug = '';
		if (
			'scan' === this.props.proFeature ||
			'backups' === this.props.proFeature ||
			'vaultpress' === this.props.proFeature
		) {
			pluginSlug = 'vaultpress/vaultpress.php';
		}
		if ( 'akismet' === this.props.proFeature ) {
			pluginSlug = 'akismet/akismet.php';
		}

		const hasFree = /jetpack_free*/.test( sitePlan.product_slug ),
			usingVPBackups = get( vpData, [ 'data', 'features', 'backups' ], false ),
			usingVPScan = get( vpData, [ 'data', 'features', 'security' ], false );

		const getStatus = ( feature, active, installed ) => {
			switch ( feature ) {
				case 'rewind':
					// This is the newer backup technology powered by Jetpack Backup.
					return this.getProActions( 'rewind_connected', 'rewind' );

				case 'backups':
					// This is the older backup technology powered by VaultPress.
					if ( hasFree && ! usingVPBackups && this.props.isCompact ) {
						return '';
					}
					break;

				case 'scan':
					if ( this.props.fetchingSiteData || this.props.isFetchingVaultPressData ) {
						return '';
					}
					if ( 'N/A' !== vpData ) {
						if ( purchasedVaultPressScan ) {
							if ( usingVPScan ) {
								return this.getProActions(
									0 === this.props.getScanThreats() ? 'secure' : 'threats',
									'scan'
								);
							}
							return this.getSetUpButton( 'scan' );
						} else if ( purchasedVaultPressBackups && ! usingVPBackups && ! this.props.isCompact ) {
							return this.getSetUpButton( 'backups' );
						}
						return '';
					} else if ( scanStatus && scanStatus.state !== 'unavailable' ) {
						if ( Array.isArray( scanStatus.threats ) && scanStatus.threats.length > 0 ) {
							return (
								<SimpleNotice showDismiss={ false } status="is-error" isCompact>
									{ _n( 'Threat', 'Threats', scanStatus.threats.length, 'jetpack' ) }
								</SimpleNotice>
							);
						}
						if ( ! scanStatus.credentials ) {
							return '';
						}
						if ( scanStatus.credentials.length === 0 ) {
							return (
								<SimpleNotice showDismiss={ false } status="is-warning" isCompact>
									{ __( 'Action needed', 'jetpack' ) }
								</SimpleNotice>
							);
						}
						return this.getProActions( 'secure', 'scan' );
					}
					break;

				case 'search':
					return '';

				case 'akismet':
					if ( hasFree && ! ( active && installed ) ) {
						return '';
					}

					if (
						! this.props.isAkismetKeyValid &&
						! this.props.fetchingAkismetData &&
						active &&
						installed &&
						! hasFree
					) {
						return this.getSetUpButton( feature );
					}
					break;
			}

			// Show set up or active status only for paid features that depend on a plugin, and only under a paid plan
			if ( sitePlan.product_slug && pluginSlug && ! hasFree ) {
				return active && installed
					? this.getProActions( 'active' )
					: this.getSetUpButton( feature );
			}

			return '';
		};

		return (
			<div>
				<QuerySitePlugins />
				<QueryAkismetKeyCheck />
				<QueryVaultPressData />
				{ ! this.props.isOfflineMode &&
					getStatus(
						this.props.proFeature,
						this.props.pluginActive( pluginSlug ),
						this.props.pluginInstalled( pluginSlug )
					) }
			</div>
		);
	}
}

export default connect( state => {
	const sitePlan = getSitePlan( state );

	return {
		siteRawUrl: getSiteRawUrl( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
		getScanThreats: () => getVaultPressScanThreatCount( state ),
		getVaultPressData: () => getVaultPressData( state ),
		getAkismetData: () => getAkismetData( state ),
		isFetchingVaultPressData: isFetchingVaultPressData( state ),
		sitePlan,
		fetchingPluginsData: isFetchingPluginsData( state ),
		pluginActive: plugin_slug => isPluginActive( state, plugin_slug ),
		pluginInstalled: plugin_slug => isPluginInstalled( state, plugin_slug ),
		isOfflineMode: isOfflineMode( state ),
		fetchingSiteData: isFetchingSiteData( state ),
		isAkismetKeyValid: isAkismetKeyValid( state ),
		fetchingAkismetData: isFetchingAkismetData( state ),
		rewindStatus: getRewindStatus( state ),
		scanStatus: getScanStatus( state ),
		purchasedVaultPressBackups: siteHasFeature( state, 'vaultpress-backups' ),
		purchasedVaultPressScan: siteHasFeature( state, 'vaultpress-security-scanning' ),
	};
} )( ProStatus );
