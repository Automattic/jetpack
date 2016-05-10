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

const DashPhoton = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'photon' )  ) {
			return(
				<DashItem label="Image Performance (Photon)" status="is-working">
					Photon is active and awesome!
				</DashItem>
			);
		}

		return(
			<DashItem label="Image Performance (Photon)">
				Image Performance (Photon) is not activated. <a onClick={ this.props.activatePhoton }>activate it</a>
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
				return dispatch( activateModule( 'photon' ) );
			}
		};
	}
)( DashPhoton );