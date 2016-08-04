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
			hasSitePlan = false !== this.props.getSitePlan(),
			inactiveOrUninstalled = this.props.isPluginInstalled( 'vaultpress/vaultpress.php' ) ? 'pro-inactive' : 'pro-uninstalled';

		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			const vpData = this.props.getVaultPressData();

			if ( vpData === 'N/A' ) {
				return(
					<DashItem label={ labelName }>
						<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
					</DashItem>
				);
			}

			if ( vpData.code === 'success' ) {
				return(
					<DashItem
						label={ labelName }
						module="vaultpress"
						status="is-working"
						className="jp-dash-item__is-active"
						pro={ true }
					>

						<p className="jp-dash-item__description">
							{ vpData.message }
							<br/>
							{ __( '{{a}}View backup details{{/a}}', {
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
				return(
					__( 'To automatically back up your entire site, please {{a}}install and activate{{/a}} VaultPress.', {
						components: {
							a: <a href='https://wordpress.com/plugins/vaultpress' target="_blank" />
						}
					} )
				);
			} else {
				return(
					__( 'To automatically back up your entire site, please {{a}}upgrade!{{/a}}.', {
						components: {
							a: <a href={ 'https://wordpress.com/plans/' + window.Initial_State.rawUrl } target="_blank" />
						}
					} )
				);
			}
		};

		return(
			<DashItem
				label={ labelName }
				module="vaultpress"
				className="jp-dash-item__is-inactive"
				status={ hasSitePlan ? inactiveOrUninstalled : 'no-pro-uninstalled-or-inactive' }
				pro={ true }
			>
				<p className="jp-dash-item__description">
					{
						isDevMode( this.props ) ? __( 'Unavailable in Dev Mode.' ) :
							upgradeOrActivateText()
					}
				</p>
			</DashItem>
		);
	},

	render: function() {
		return(
			<div className="jp-dash-item__interior">
				<QueryVaultPressData />
				{ this.getContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isFetchingModulesList: () => _isFetchingModulesList( state ),
			getVaultPressData: () => _getVaultPressData( state ),
			getSitePlan: () => getSitePlan( state ),
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
