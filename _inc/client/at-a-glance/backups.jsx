/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import { getSitePlan } from 'state/site';
import { isPluginInstalled } from 'state/site/plugins';
import { getVaultPressData } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

class DashBackups extends Component {
	getContent() {
		const labelName = __( 'Backups' ),
			hasSitePlan = false !== this.props.sitePlan && 'jetpack_free' !== this.props.sitePlan.product_slug,
			inactiveOrUninstalled = this.props.isPluginInstalled( 'vaultpress/vaultpress.php' ) ? 'pro-inactive' : 'pro-uninstalled';

		if ( this.props.getOptionValue( 'vaultpress' ) ) {
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
									a: <a href="https://dashboard.vaultpress.com" target="_blank" rel="noopener noreferrer" />
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
							a: <a href="https://wordpress.com/plugins/vaultpress" target="_blank" rel="noopener noreferrer" />
						}
					} )
				);
			}

			return (
				__( 'To automatically back up your entire site, please {{a}}upgrade your account{{/a}}.', {
					components: {
						a: <a href={ 'https://jetpack.com/redirect/?source=aag-backups&site=' + this.props.siteRawUrl } target="_blank" rel="noopener noreferrer" />
					}
				} )
			);
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
						this.props.isDevMode ? __( 'Unavailable in Dev Mode.' )
							: upgradeOrActivateText()
					}
				</p>
			</DashItem>
		);
	}

	render() {
		return (
			<div className="jp-dash-item__interior">
				<QueryVaultPressData />
				{ this.getContent() }
			</div>
		);
	}
}

DashBackups.propTypes = {
	vaultPressData: PropTypes.any.isRequired,
	isDevMode: PropTypes.bool.isRequired,
	siteRawUrl: PropTypes.string.isRequired,
	sitePlan: PropTypes.object.isRequired
};

export default connect(
	( state ) => {
		return {
			vaultPressData: getVaultPressData( state ),
			sitePlan: getSitePlan( state ),
			isDevMode: isDevMode( state ),
			isPluginInstalled: ( plugin_slug ) => isPluginInstalled( state, plugin_slug )
		};
	}
)( DashBackups );
