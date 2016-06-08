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
import { isDevMode } from 'state/connection';

const DashPhoton = React.createClass( {
	getContent: function() {
		const labelName = __( 'Image Performance %(photon)s', { args: { photon: '(Photon)' } } );

		if ( this.props.isModuleActivated( 'photon' ) ) {
			return(
				<DashItem label={ labelName } status="is-working">
					<p className="jp-dash-item__description">{ __( 'Photon is active and currently improving image performance.' ) }</p>
				</DashItem>
			);
		}

		return(
			<DashItem label={ labelName } className="jp-dash-item__is-inactive">
				<p className="jp-dash-item__description">
					{
						isDevMode( this.props ) ? __( 'Unavailable in Dev Mode' ) :
						__( '{{a}}Activate Photon{{/a}} to enhance the performance of your images.', {
							components: {
								a: <a href="javascript:void(0)" onClick={ this.props.activatePhoton } />
							}
						} )
					}
				</p>
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
