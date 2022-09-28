import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DashItem from 'components/dash-item';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import { isModuleAvailable } from 'state/modules';

class DashPhoton extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
	};

	activatePhoton = () => this.props.updateOptions( { photon: true } );

	getContent() {
		const labelName = __( 'Image Accelerator', 'jetpack' );

		const support = {
			text: __(
				'Jetpack will optimize your images and serve them from the server location nearest to your visitors. Using our global content delivery network will boost the loading speed of your site.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-photon' ),
		};

		if ( this.props.getOptionValue( 'photon' ) ) {
			return (
				<DashItem label={ labelName } module="photon" support={ support } status="is-working">
					<p className="jp-dash-item__description">
						{ __(
							"Jetpack is optimizing your image sizes and download speed using our fast global network of servers. This improves your site's performance on desktop and mobile devices.",
							'jetpack'
						) }
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
					{ this.props.isOfflineMode
						? __( 'Unavailable in Offline Mode', 'jetpack' )
						: createInterpolateElement(
								__(
									"<a>Activate</a> to optimize image sizes and load images from Jetpack's fast global network of servers. This improves your site's performance on desktop and mobile devices.",
									'jetpack'
								),
								{
									a: <a href="javascript:void(0)" onClick={ this.activatePhoton } />,
								}
						  ) }
				</p>
			</DashItem>
		);
	}

	render() {
		return this.props.isModuleAvailable && this.getContent();
	}
}

export default connect( state => ( {
	isOfflineMode: isOfflineMode( state ),
	isModuleAvailable: isModuleAvailable( state, 'photon' ),
} ) )( DashPhoton );
