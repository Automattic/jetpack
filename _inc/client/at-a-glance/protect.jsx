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

const DashProtect = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'protect' ) ) {
			return(
				<DashItem label="Protect">
					Sit back and relax. Protect is on and actively blocking malicious login attempts. Data will display here soon.
				</DashItem>
			);
		}

		return(
			<DashItem label="Protect" status="is-info">
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
			getModule: ( module_name ) => _getModule( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			activateProtect: () => {
				return dispatch( activateModule( 'protect' ) );
			}
		};
	}
)( DashProtect );