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
import {
	isModuleActivated as _isModuleActivated,
	activateModule
} from 'state/modules';

const DashSiteVerify = React.createClass( {
	getContent: function() {
		const labelName = __( 'Site Verification Tools' );
		if ( this.props.isModuleActivated( 'verification-tools' ) ) {
			return(
				<DashItem label={ labelName } status="is-working">
					<p className="jp-dash-item__description">
						{
							__( 'Site Verification Tools are active. Ensure your site is verified with Google, ' +
								'Bing, and Pinterest for more accurate indexing and ranking. {{a}}Verify now{{/a}}', {
								components: {
									a: <a href={ window.Initial_State.adminUrl + 'tools.php' } />
								}
							} )
						}
					</p>
				</DashItem>
			);
		}

		return(
			<DashItem label={ labelName } className="jp-dash-item__is-inactive">
				<p className="jp-dash-item__description">
					{
						__( '{{a}}Activate Site Verification{{/a}} to verify your site and increase ranking with Google, Bing, and Pinterest.', {
							components: {
								a: <a onClick={ this.props.activateVerificationTools } href="javascript:void(0)" />
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
