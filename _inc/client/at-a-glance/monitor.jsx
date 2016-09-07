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
import QueryLastDownTime from 'components/data/query-last-downtime';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isFetchingModulesList as _isFetchingModulesList,
	getModules
} from 'state/modules';
import { getLastDownTime as _getLastDownTime } from 'state/at-a-glance';
import { isDevMode } from 'state/connection';

const DashMonitor = React.createClass( {
	getContent: function() {
		const labelName = __( 'Downtime Monitoring' );

		if ( this.props.isModuleActivated( 'monitor' ) ) {
			const lastDowntime = this.props.getLastDownTime();

			if ( lastDowntime === 'N/A' ) {
				return (
					<DashItem
						label={ labelName }
						module="monitor"
						status="is-working"
					>
						<QueryLastDownTime />
						<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
					</DashItem>
				);
			}

			return (
				<DashItem
					label={ labelName }
					module="monitor"
					status="is-working"
				>
					<p className="jp-dash-item__description">{ __( 'Jetpack is monitoring your site. If we think your site is down you will receive an email.' ) }</p>
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
						isDevMode( this.props ) ? __( 'Unavailable in Dev Mode.' ) :
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
				<QueryLastDownTime />
				{ this.getContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isFetchingModulesList: () => _isFetchingModulesList( state ),
			getLastDownTime: () => _getLastDownTime( state ),
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
