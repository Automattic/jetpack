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

	activatePhoton = () => this.props.updateOptions( { photon: true } );

	getContent() {
		const labelName = __( 'Image Performance' );

		const support = {
			text: __(
				'Jetpack will optimize your images and serve them from the server location nearest to your visitors. Using our global content delivery network will boost the loading speed of your site.'
			),
			link: 'https://jetpack.com/support/photon/',
		};

		if ( this.props.getOptionValue( 'photon' ) ) {
			return (
				<DashItem label={ labelName } module="photon" support={ support } status="is-working">
					<p className="jp-dash-item__description">
						{ __( 'Jetpack is improving and optimizing your image speed.' ) }
					</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="photon"
				support={ support }
				className="jp-dash-item__is-inactive"
			>
				<p className="jp-dash-item__description">
					{ this.props.isDevMode
						? __( 'Unavailable in Dev Mode' )
						: __( '{{a}}Activate{{/a}} to enhance the performance and speed of your images.', {
								components: {
									a: <a href="javascript:void(0)" onClick={ this.activatePhoton } />,
								},
						  } ) }
				</p>
			</DashItem>
		);
	}

	render() {
		return this.props.isModuleAvailable && this.getContent();
	}
}

export default connect( state => ( {
	isDevMode: isDevMode( state ),
	isModuleAvailable: isModuleAvailable( state, 'photon' ),
} ) )( DashPhoton );
