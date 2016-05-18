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

const DashPhoton = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'photon' ) ) {
			return(
				<DashItem label="Image Performance (Photon)" status="is-working">
					<p className="jp-dash-item__description">Photon is active and currently improving image performance.</p>
				</DashItem>
			);
		}

		return(
			<DashItem label="Image Performance (Photon)" className="jp-dash-item__is-inactive">
				<p className="jp-dash-item__description"><a href="javascript:void(0)" onClick={ this.props.activatePhoton }>Activate Photon</a> to enhance the performance of your images.</p>
			</DashItem>
		);
	},

	render: function() {
		return(
			<div className="jp-dash-item__interior">
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
