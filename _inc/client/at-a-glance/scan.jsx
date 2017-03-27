/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { numberFormat, translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';
import { getSitePlan } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';
import { isDevMode } from 'state/connection';
import { isFetchingSiteData } from 'state/site';

const DashScan = React.createClass( {
	getContent: function() {
		const labelName = __( 'Security Scanning' ),
			hasSitePlan = false !== this.props.sitePlan,
			vpData = this.props.vaultPressData,
			inactiveOrUninstalled = this.props.isPluginInstalled( 'vaultpress/vaultpress.php' ) ? 'pro-inactive' : 'pro-uninstalled',
			scanEnabled = (
				'undefined' !== typeof vpData.data &&
				'undefined' !== typeof vpData.data.features &&
				'undefined' !== typeof vpData.data.features.security &&
				vpData.data.features.security
			),
			hasPremium = /jetpack_premium*/.test( this.props.sitePlan.product_slug ),
			hasBusiness = /jetpack_business*/.test( this.props.sitePlan.product_slug );

		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			if ( vpData === 'N/A' ) {
				return (
					<DashItem label={ labelName }>
						<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
					</DashItem>
				);
			}

			if ( scanEnabled ) {
				// Check for threats
				const threats = this.props.scanThreats;
				if ( threats !== 0 ) {
					return (
						<DashItem
							label={ labelName }
							module="scan"
							pro={ true }
						>
							<h3>{
								__(
									'Uh oh, %(number)s threat found.', 'Uh oh, %(number)s threats found.',
									{
										count: threats,
										args: {
											number: numberFormat( threats )
										}
									} )
							}</h3>
							<p className="jp-dash-item__description">
								{ __( '{{a}}View details at VaultPress.com{{/a}}', { components: { a: <a href="https://dashboard.vaultpress.com/" /> } } ) }
								<br/>
								{ __( '{{a}}Contact Support{{/a}}', { components: { a: <a href='https://jetpack.com/support' /> } } ) }
							</p>
						</DashItem>
					);
				}

				// All good
				if ( vpData.code === 'success' ) {
					return (
						<DashItem
							label={ labelName }
							module="scan"
							status="is-working"
							pro={ true } >
							<p className="jp-dash-item__description">
								{ __( "No threats found, you're good to go!" ) }
							</p>
						</DashItem>
					);
				}
			}
		}

		const upgradeOrActivateText = () => {
			if ( this.props.fetchingSiteData ) {
				return __( 'Loading…' );
			}

			if ( hasPremium || hasBusiness || scanEnabled ) {
				return (
					__( 'For automated, comprehensive scanning of security threats, please {{a}}install and activate{{/a}} VaultPress.', {
						components: {
							a: <a href='https://wordpress.com/plugins/vaultpress' target="_blank" rel="noopener noreferrer" />
						}
					} )
				);
			} else {
				return (
					__( 'For automated, comprehensive scanning of security threats, please {{a}}upgrade your account{{/a}}.', {
						components: {
							a: <a href={ 'https://jetpack.com/redirect/?source=aag-scan&site=' + this.props.siteRawUrl } target="_blank" rel="noopener noreferrer" />
						}
					} )
				);
			}
		};

		return (
			<DashItem
				label={ labelName }
				module="scan"
				className="jp-dash-item__is-inactive"
				status={ hasSitePlan ? inactiveOrUninstalled : 'no-pro-uninstalled-or-inactive' }
				pro={ true } >
				<p className="jp-dash-item__description">
					{
						this.props.isDevMode ? __( 'Unavailable in Dev Mode.' ) :
							upgradeOrActivateText()
					}
				</p>
			</DashItem>
		);
	},

	render: function() {
		return (
			<div>
				<QueryVaultPressData />
				{ this.getContent() }
			</div>
		);
	}
} );

DashScan.propTypes = {
	vaultPressData: React.PropTypes.any.isRequired,
	scanThreats: React.PropTypes.any.isRequired,
	isDevMode: React.PropTypes.bool.isRequired,
	siteRawUrl: React.PropTypes.string.isRequired,
	sitePlan: React.PropTypes.object.isRequired
}

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isFetchingModulesList: () => _isFetchingModulesList( state ),
			vaultPressData: _getVaultPressData( state ),
			scanThreats: _getVaultPressScanThreatCount( state ),
			sitePlan: getSitePlan( state ),
			isDevMode: isDevMode( state ),
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug ),
			fetchingSiteData: isFetchingSiteData( state )
		};
	},
	( dispatch ) => {
		return {
			activateModule: ( slug ) => {
				return dispatch( activateModule( slug ) );
			}
		};
	}
)( DashScan );
