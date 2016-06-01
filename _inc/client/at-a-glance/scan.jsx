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
import {
	getVaultPressScanThreatCount as _getVaultPressScanThreatCount,
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

const DashScan = React.createClass( {
	getContent: function() {
		const labelName = __( 'Security Scan %(vaultpress)s', { args: { vaultpress: '(VaultPress)' } } );
		const vpData = this.props.getVaultPressData();
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
					<DashItem label={ labelName } status="is-error">
						<h3>{
							__(
								'Uh oh, %(number)s threat found.', 'Uh oh, %(number)s threats found.',
								{
									count: threats,
									args: {
										number: threats
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
					<DashItem label={ labelName } status="is-working">
						<h3>{ __( "No threats found, you're good to go!" ) }</h3>
					</DashItem>
				);
			}
		}

		return(
			<DashItem label={ labelName } className="jp-dash-item__is-inactive" status="is-premium-inactive">
				<p className="jp-dash-item__description">
					{
						isDevMode( this.props ) ? __( 'Unavailable in Dev Mode.' ) :
						__( 'To automatically scan your site for malicious threats, please {{a}}upgrade your account{{/a}}', {
							components: {
								a: <a href={ 'https://wordpress.com/plans/' + window.Initial_State.rawUrl } target="_blank" />
							}
						} )
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
