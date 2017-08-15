/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import { getModules } from 'state/modules';
import { isDevMode } from 'state/connection';

class DashPhoton extends Component {
	getContent() {
		const labelName = __( 'Image Performance' ),
			activatePhoton = () => this.props.updateOptions( { 'photon': true } );

		if ( this.props.getOptionValue( 'photon' ) ) {
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
						this.props.isDevMode ? __( 'Unavailable in Dev Mode' )
							: __( '{{a}}Activate{{/a}} to enhance the performance and speed of your images.', {
								components: {
									a: <a href="javascript:void(0)" onClick={ activatePhoton } />
								}
							}
						)
					}
				</p>
			</DashItem>
		);
	}

	render() {
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
}

DashPhoton.propTypes = {
	isDevMode: React.PropTypes.bool.isRequired
};

export default connect(
	( state ) => {
		return {
			isDevMode: isDevMode( state ),
			moduleList: getModules( state )
		};
	}
)( DashPhoton );
