/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';

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
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

const DashBackups = React.createClass( {
	getContent: function() {
		const labelName = __( 'Backups' ),
			hasSitePlan = false !== this.props.sitePlan,
			inactiveOrUninstalled = this.props.isPluginInstalled( 'vaultpress/vaultpress.php' ) ? 'pro-inactive' : 'pro-uninstalled';

		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			const vpData = this.props.vaultPressData;

			if ( vpData === 'N/A' ) {
				return (
					<DashItem label={ labelName }>
						<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
					</DashItem>
				);
			}

			if ( vpData.code === 'success' ) {
				return (
					<DashItem
						label={ labelName }
						module="backups"
						status="is-working"
						className="jp-dash-item__is-active"
						pro={ true }
					>

						<p className="jp-dash-item__description">
							{ vpData.message }
							&nbsp;
							{ __( '{{a}}View backup details{{/a}}.', {
								components: {
									a: <a href='https://dashboard.vaultpress.com' target="_blank" />
								}
							} ) }
						</p>
					</DashItem>
				);
			}
		}

		const upgradeOrActivateText = () => {
			if ( hasSitePlan ) {
				return (
					__( 'To automatically back up your entire site, please {{a}}install and activate{{/a}} VaultPress.', {
						components: {
							a: <a href='https://wordpress.com/plugins/vaultpress' target="_blank" />
						}
					} )
				);
			} else {
				return (
					__( 'To automatically back up your entire site, please {{a}}upgrade!{{/a}}.', {
						components: {
							a: <a href={ 'https://jetpack.com/redirect/?source=aag-backups&site=' + this.props.siteRawUrl } target="_blank" />
						}
					} )
				);
			}
		};

		return (
			<DashItem
				label={ labelName }
				module="backups"
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
			<div className="jp-dash-item__interior">
				<QueryVaultPressData />
				{ this.getContent() }
			</div>
		);
	}
} );

DashBackups.propTypes = {
	vaultPressData: React.PropTypes.any.isRequired,
	isDevMode: React.PropTypes.bool.isRequired,
	siteRawUrl: React.PropTypes.string.isRequired,
	sitePlan: React.PropTypes.object.isRequired
};

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isFetchingModulesList: () => _isFetchingModulesList( state ),
			vaultPressData: _getVaultPressData( state ),
			sitePlan: getSitePlan( state ),
			isDevMode: isDevMode( state ),
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug )
		};
	},
	( dispatch ) => {
		return {
			activateModule: ( slug ) => {
				return dispatch( activateModule( slug ) );
			}
		};
	}
)( DashBackups );
