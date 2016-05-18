/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';

/**
 * Internal dependencies
 */
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';

const DashScan = React.createClass( {
	getContent: function() {
		const vpData = this.props.getVaultPressData();
		let vpActive = typeof vpData.data !== 'undefined' && vpData.data.active;

		const ctaLink = vpActive ?
			'https://dashboard.vaultpress.com/' :
			'https://wordpress.com/plans/' + window.Initial_State.rawUrl;

		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			if ( vpData === 'N/A' ) {
				return(
					<DashItem label="Security Scan (VaultPress)">
						<p className="jp-dash-item__description">Loading&#8230;</p>
					</DashItem>
				);
			}

			// Check for threats
			const threats = this.props.getScanThreats();
			if ( threats !== 0 ) {
				return(
					<DashItem label="Security Scan (VaultPress)" status="is-error">
						<h3>Uh oh, { threats } found!</h3>
						<p className="jp-dash-item__description"><a href={ ctaLink }>Do something.</a></p>
					</DashItem>
				);
			}

			// All good
			if ( vpData.code === 'success' ) {
				return(
					<DashItem label="Security Scan (VaultPress)" status="is-working">
						<h3>No threats found, you're good to go!</h3>
					</DashItem>
				);
			}
		}

		return(
			<DashItem label="Security Scan (VaultPress)" className="jp-dash-item__is-inactive" status="is-premium-inactive">
				<p className="jp-dash-item__description">To automatically scan your site for malicious threats, please <a href={ ctaLink }>upgrade your account</a> or <a href={ ctaLink }>learn more</a>.</p>
			</DashItem>
		);
	},

	render: function() {
		return(
			<div>
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
			getScanThreats: () => _getVaultPressScanThreatCount( state )
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
