/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';
import SimpleNotice from 'components/notice';

/**
 * Internal dependencies
 */
import { getSiteRawUrl } from 'state/initial-state';
import QuerySitePlugins from 'components/data/query-site-plugins';
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import QueryAkismetData from 'components/data/query-akismet-data';
import { isDevMode } from 'state/connection';
import {
	isFetchingPluginsData,
	isPluginActive,
	isPluginInstalled
} from 'state/site/plugins';
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData,
	getAkismetData as _getAkismetData
} from 'state/at-a-glance';
import {
	getSitePlan,
} from 'state/site';

const ProStatus = React.createClass( {
	propTypes: {
		isCompact: React.PropTypes.bool,
		proFeature: React.PropTypes.string
	},

	getDefaultProps: function() {
		return {
			isCompact: true,
			proFeature: ''
		}
	},

	render() {
		let sitePlan = this.props.sitePlan(),
			pluginSlug = 'scan' === this.props.proFeature || 'backups' === this.props.proFeature || 'vaultpress' === this.props.proFeature ?
			'vaultpress/vaultpress.php' :
			'akismet/akismet.php';

		let getStatus = ( feature, active, installed ) => {
			let vpData = this.props.getVaultPressData();

			if ( this.props.isDevMode ) {
				return __( 'Unavailable in Dev Mode' );
			}

			if ( 'N/A' !== vpData && 'scan' === feature && 0 !== this.props.getScanThreats() ) {
				return(
					<SimpleNotice
						showDismiss={ false }
						status='is-error'
						isCompact={ true }
					>
						{ __( 'Threats found!' ) }
					</SimpleNotice>
				);
			}

			if ( 'akismet' === feature ) {
				const akismetData = this.props.getAkismetData();
				if ( 'invalid_key' === akismetData ) {
					return(
						<SimpleNotice
							showDismiss={ false }
							status='is-warning'
							isCompact={ true }
						>
							{ __( 'Invalid Key' ) }
						</SimpleNotice>
					);
				}
			}

			if ( false !== sitePlan ) {
				let btnVals = {};
				if ( 'jetpack_free' !== sitePlan.product_slug ) {
					btnVals = {
						href: `https://wordpress.com/plugins/setup/${ this.props.siteRawUrl }?only=${ feature }`,
						text: __( 'Set up' )
					}
				} else {
					btnVals = {
						href: 'https://wordpress.com/plans/' + this.props.siteRawUrl,
						text: __( 'Upgrade' )
					}
				}

				if ( active && installed ) {
					return <span className="jp-dash-item__active-label">{ __( 'ACTIVE' ) }</span>;
				}

				return (
					<Button
						compact={ true }
						primary={ true }
						href={ btnVals.href }
					>
						{ btnVals.text }
					</Button>
				);
			}

			return active && installed ?
				<span className="jp-dash-item__active-label">{ __( 'ACTIVE' ) }</span>
				: '';
		};

		return(
			<div>
				<QuerySitePlugins />
				<QueryAkismetData />
				<QueryVaultPressData />
				{ getStatus(
					this.props.proFeature,
					this.props.pluginActive( pluginSlug ),
					this.props.pluginInstalled( pluginSlug )
				) }
			</div>
		)
	}
} );

export default connect(
	( state ) => {
		return {
			siteRawUrl: getSiteRawUrl( state ),
			getScanThreats: () => _getVaultPressScanThreatCount( state ),
			getVaultPressData: () => _getVaultPressData( state ),
			getAkismetData: () => _getAkismetData( state ),
			sitePlan: () => getSitePlan( state ),
			fetchingPluginsData: isFetchingPluginsData( state ),
			pluginActive: ( plugin_slug ) => isPluginActive( state, plugin_slug ),
			pluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug ),
			isDevMode: isDevMode( state )
		};
	}
)( ProStatus );
