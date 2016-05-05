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
	activateModule,
	isActivatingModule,
} from 'state/modules';
import {
	fetchProtectCount,
	getProtectCount as _getProtectCount
} from 'state/at-a-glance';

const DashProtect = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'protect' )  ) {
			return(
				<DashItem label="Protect" status="is-working">
					<h1>{ this.props.getProtectCount() }</h1> Blocked attacks!
				</DashItem>
			);
		}

		return(
			<DashItem label="Protect">
				Protect is not on. <a onClick={ this.props.activateProtect }>activate it</a>
			</DashItem>
		);
	},

	render: function() {
		return this.getContent();
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			getProtectCount: () => _getProtectCount( state ),
			getModule: ( module_name ) => _getModule( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			activateProtect: () => {
				return dispatch( activateModule( 'protect' ) );
			},
			fetchProtectCount: () => {
				return dispatch( fetchProtectCount() );
			}
		};
	}
)( DashProtect );