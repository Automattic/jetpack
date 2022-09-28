import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DashItem from 'components/dash-item';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode, hasConnectedOwner, connectUser } from 'state/connection';
import { isModuleAvailable } from 'state/modules';

class DashMonitor extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
		hasConnectedOwner: PropTypes.bool.isRequired,
	};

	activateAndTrack = () => {
		analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
			module: 'monitor',
			toggled: 'on',
		} );

		this.props.updateOptions( { monitor: true } );
	};

	connect = () => this.props.connectUser();

	getContent() {
		const labelName = __( 'Downtime monitoring', 'jetpack' );

		const support = {
			text: __(
				'Jetpack’s downtime monitor will continuously monitor your site and alert you the moment that downtime is detected.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-monitor' ),
		};

		if (
			this.props.getOptionValue( 'monitor' ) &&
			! this.props.isOfflineMode &&
			this.props.hasConnectedOwner
		) {
			return (
				<DashItem label={ labelName } module="monitor" support={ support } status="is-working">
					<p className="jp-dash-item__description">
						{ __(
							'Jetpack is monitoring your site. If we think your site is down, you will receive an email.',
							'jetpack'
						) }
					</p>
				</DashItem>
			);
		}

		const activateMessage = this.props.hasConnectedOwner
			? createInterpolateElement(
					__(
						'<a>Activate Monitor</a> to receive email notifications if your site goes down.',
						'jetpack'
					),
					{
						a: <a href="javascript:void(0)" onClick={ this.activateAndTrack } />,
					}
			  )
			: __(
					'Get alerts if your site goes offline. We’ll let you know when it’s back up, too.',
					'jetpack'
			  );

		return (
			<DashItem
				label={ labelName }
				module="monitor"
				support={ support }
				className="jp-dash-item__is-inactive"
				noToggle={ ! this.props.hasConnectedOwner }
			>
				<p className="jp-dash-item__description">
					{ this.props.isOfflineMode
						? __( 'Unavailable in Offline Mode.', 'jetpack' )
						: activateMessage }
				</p>

				{ ! this.props.isOfflineMode && ! this.props.hasConnectedOwner && (
					<p className="jp-dash-item__description jp-dash-item__connect">
						{ createInterpolateElement(
							__( '<a>Connect your WordPress.com</a> account to use this feature.', 'jetpack' ),
							{
								a: <a href="javascript:void(0)" onClick={ this.connect } />,
							}
						) }
					</p>
				) }
			</DashItem>
		);
	}

	render() {
		return this.props.isModuleAvailable && this.getContent();
	}
}

export default connect(
	state => ( {
		isOfflineMode: isOfflineMode( state ),
		isModuleAvailable: isModuleAvailable( state, 'monitor' ),
		hasConnectedOwner: hasConnectedOwner( state ),
	} ),
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashMonitor );
