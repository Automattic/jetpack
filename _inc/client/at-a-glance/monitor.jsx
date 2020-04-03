/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import { isModuleAvailable } from 'state/modules';
import { isDevMode } from 'state/connection';
import DashItem from 'components/dash-item';

class DashMonitor extends Component {
	static propTypes = {
		isDevMode: PropTypes.bool.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
	};

	activateAndTrack = () => {
		analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
			module: 'monitor',
			toggled: 'on',
		} );

		this.props.updateOptions( { monitor: true } );
	};

	getContent() {
		const labelName = __( 'Downtime monitor' );

		const support = {
			text: __(
				'Jetpack’s downtime monitor will continuously monitor your site, and alert you the moment that downtime is detected.'
			),
			link: getRedirectUrl( 'jetpack-support-monitor' ),
		};

		if ( this.props.getOptionValue( 'monitor' ) ) {
			return (
				<DashItem label={ labelName } module="monitor" support={ support } status="is-working">
					<p className="jp-dash-item__description">
						{ __(
							'Jetpack is monitoring your site. If we think your site is down, you will receive an email.'
						) }
					</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="monitor"
				support={ support }
				className="jp-dash-item__is-inactive"
			>
				<p className="jp-dash-item__description">
					{ this.props.isDevMode
						? __( 'Unavailable in Dev Mode.' )
						: __(
								'{{a}}Activate Monitor{{/a}} to receive email notifications if your site goes down.',
								{
									components: {
										a: <a href="javascript:void(0)" onClick={ this.activateAndTrack } />,
									},
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
	isDevMode: isDevMode( state ),
	isModuleAvailable: isModuleAvailable( state, 'monitor' ),
} ) )( DashMonitor );
