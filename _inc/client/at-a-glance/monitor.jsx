/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import DashSectionHeader from 'components/dash-section-header';

/**
 * Internal dependencies
 */
import QueryLastDownTime from 'components/data/query-last-downtime';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';
import { getLastDownTime as _getLastDownTime } from 'state/at-a-glance';

const DashMonitor = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'monitor' )  ) {
			const lastDowntime = this.props.getLastDownTime();

			if ( lastDowntime === 'N/A' ) {
				return(
					<DashItem label="Downtime Monitoring" status="is-working">
						<QueryLastDownTime />
						Loading...
					</DashItem>
				);
			}

			return(
				<DashItem label="Downtime Monitoring" status="is-working">
					Monitor is on and is watching your site. <br/><br/>
					Last downtime was { lastDowntime.date } ago.
				</DashItem>
			);
		}

		return(
			<DashItem label="Downtime Monitoring" className="jp-dash-item__is-inactive">
				Monitor isn't on. <a onClick={ this.props.activateMonitor }>Turn it on.</a>
			</DashItem>
		);
	},

	render: function() {
		return(
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
			getLastDownTime: () => _getLastDownTime( state )
		};
	},
	( dispatch ) => {
		return {
			activateMonitor: ( slug ) => {
				return dispatch( activateModule( 'monitor' ) );
			}
		};
	}
)( DashMonitor );