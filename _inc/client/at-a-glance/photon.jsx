/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { isModuleAvailable } from 'state/modules';
import { isDevMode } from 'state/connection';

class DashPhoton extends Component {
	static propTypes = {
		isDevMode: PropTypes.bool.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
	};

	getContent() {
		const labelName = __( 'Image Performance' ),
			activatePhoton = () => this.props.updateOptions( { photon: true } );

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
		return this.props.isModuleAvailable && this.getContent();
	}
}

export default connect(
	state => ( {
		isDevMode: isDevMode( state ),
		isModuleAvailable: isModuleAvailable( state, 'photon' ),
	} )
)( DashPhoton );
