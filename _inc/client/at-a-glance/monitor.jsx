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

const DashMonitor = React.createClass( {
	getContent: function() {
		const labelName = __( 'Downtime Monitoring' );

		if ( this.props.isModuleActivated( 'monitor' ) ) {
			return (
				<DashItem
					label={ labelName }
					module="monitor"
					status="is-working"
				>
					<p className="jp-dash-item__description">{ __( 'Jetpack is monitoring your site. If we think your site is down, you will receive an email.' ) }</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="monitor"
				className="jp-dash-item__is-inactive"
			>
				<p className="jp-dash-item__description">
					{
						this.props.isDevMode ? __( 'Unavailable in Dev Mode.' ) :
						__( '{{a}}Activate Monitor{{/a}} to receive notifications if your site goes down.', {
							components: {
								a: <a href="javascript:void(0)" onClick={ this.props.activateMonitor } />
							}
						} )
					}
				</p>
			</DashItem>
		);
	},

	render: function() {
		const moduleList = Object.keys( this.props.moduleList );
		if ( ! includes( moduleList, 'monitor' ) ) {
			return null;
		}

		return (
			<div>
				{ this.getContent() }
			</div>
		);
	}
} );

DashMonitor.propTypes = {
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
			activateMonitor: () => {
				return dispatch( activateModule( 'monitor' ) );
			}
		};
	}
)( DashMonitor );
