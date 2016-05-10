/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import DashSectionHeader from 'components/dash-section-header';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule
} from 'state/modules';

const DashSiteVerify = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'verification-tools' )  ) {
			return(
				<DashItem label="Site Verification Tools" status="is-working">
					<p className="jp-dash-item__description">Site verification tools is active. Ensure your site is verifed with Google, Bing, &amp; Pinterest for more accurate indexing and ranking. <a href="#">Verify now (null)</a></p>
				</DashItem>
			);
		}

		return(
			<DashItem label="Site Verification Tools" className="jp-dash-item__is-inactive">
				<p className="jp-dash-item__description"><a onClick={ this.props.activatePhoton }>Activate Site Verification</a> to verify your site and increase ranking with Google, Bing, and Pinterest.</p>
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
			activatePhoton: () => {
				return dispatch( activateModule( 'verification-tools' ) );
			}
		};
	}
)( DashSiteVerify );