/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule
} from 'state/modules';

const DashSiteVerify = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'verification-tools' ) ) {
			return(
				<DashItem label="Site Verification Tools" status="is-working">
					<p className="jp-dash-item__description">Site Verification Tools are active. Ensure your site is verified with Google, Bing, &amp; Pinterest for more accurate indexing and ranking. <a href={ window.Initial_State.adminUrl + 'tools.php' }>Verify now</a></p>
				</DashItem>
			);
		}

		return(
			<DashItem label="Site Verification Tools" className="jp-dash-item__is-inactive">
				<p className="jp-dash-item__description"><a onClick={ this.props.activateVerificationTools } href="javascript:void(0)">Activate Site Verification</a> to verify your site and increase ranking with Google, Bing, and Pinterest.</p>
			</DashItem>
		);
	},

	render: function() {
		return(
			<div>
				{ this.getContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			activateVerificationTools: () => {
				return dispatch( activateModule( 'verification-tools' ) );
			}
		};
	}
)( DashSiteVerify );
