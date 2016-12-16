/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	getModules
} from 'state/modules';
import { isDevMode } from 'state/connection';

const DashPhoton = React.createClass( {
	getContent: function() {
		const labelName = __( 'Image Performance %(photon)s', { args: { photon: '(Photon)' } } );

		if ( this.props.isModuleActivated( 'photon' ) ) {
			return (
				<DashItem
					label={ labelName }
					module="photon"
					status="is-working" >
					<p className="jp-dash-item__description">{ __( 'Jetpack is improving and optimizing your image speed.' ) }</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="photon"
				className="jp-dash-item__is-inactive" >
				<p className="jp-dash-item__description">
					{
						this.props.isDevMode ? __( 'Unavailable in Dev Mode' ) :
						__( '{{a}}Activate Photon{{/a}} to enhance the performance and speed of your images.', {
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
		const moduleList = Object.keys( this.props.moduleList );
		if ( ! includes( moduleList, 'photon' ) ) {
			return null;
		}

		return (
			<div className="jp-dash-item__interior">
				{ this.getContent() }
			</div>
		);
	}
} );

DashPhoton.propTypes = {
	isDevMode: React.PropTypes.bool.isRequired
};

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isDevMode: isDevMode( state ),
			moduleList: getModules( state )
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
