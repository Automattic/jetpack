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
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

const DashScan = React.createClass( {
	getContent: function() {
		const labelName = __( 'Malware Scan' ),
			hasSitePlan = false !== this.props.getSitePlan(),
			vpData = this.props.getVaultPressData();

		let vpActive = typeof vpData.data !== 'undefined' && vpData.data.active;

		const ctaLink = vpActive ?
			'https://dashboard.vaultpress.com/' :
			'https://wordpress.com/plans/' + window.Initial_State.rawUrl;

		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			if ( vpData === 'N/A' ) {
				return(
					<DashItem label={ labelName }>
						<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
					</DashItem>
				);
			}

			// Check for threats
			const threats = this.props.getScanThreats();
			if ( threats !== 0 ) {
				return(
					<DashItem
						label={ labelName }
						status="is-error"
						statusText={ __( 'Threats found' ) }
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
							{ __( '{{a}}View details at VaultPress.com{{/a}}', { components: { a: <a href={ ctaLink } /> } } ) }
							<br/>
							{ __( '{{a}}Contact Support{{/a}}', { components: { a: <a href='https://jetpack.com/support' /> } } ) }
						</p>
					</DashItem>
				);
			}

			// All good
			if ( vpData.code === 'success' ) {
				return(
					<DashItem
						label={ labelName }
						status="is-working"
						pro={ true }
					>
						<p className="jp-dash-item__description">
							{ __( "No threats found, you're good to go!" ) }
						</p>
					</DashItem>
				);
			}
		}

		const upgradeOrActivateText = () => {
			if ( hasSitePlan ) {
				return(
					__( 'To automatically scan your site for malicious threats, please {{a}}install and activate{{/a}} VaultPress', {
						components: {
							a: <a href='https://wordpress.com/plugins/vaultpress' target="_blank" />
						}
					} )
				);
			} else {
				return(
					__( 'To automatically scan your site for malicious threats, please {{a}}upgrade your account{{/a}}', {
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
				status="pro-inactive"
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
			getScanThreats: () => _getVaultPressScanThreatCount( state ),
			getSitePlan: () => getSitePlan( state )
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
