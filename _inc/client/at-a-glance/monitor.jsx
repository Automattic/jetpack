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
		if ( this.props.isFetchingModulesList( this.props ) ) {
			return(
				<DashItem label="Monitor">
					<QueryLastDownTime />
					Loading Data...
				</DashItem>
			);
		}

		if ( this.props.isModuleActivated( 'monitor' )  ) {
			const lastDowntime = this.props.getLastDownTime();

			return(
				<DashItem label="Monitor" status="is-working">
					Monitor is on and is watching your site. <br/><br/>
					Last downtime was { lastDowntime }
				</DashItem>
			);
		}

		return(
			<DashItem label="Monitor">
				Monitor isn't on. <a onClick={ this.props.activateModule( 'monitor' ) }>Turn it on.</a>
			</DashItem>
		);
	},

	render: function() {
		return this.getContent();
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
			activateModule: ( slug ) => {
				return dispatch( activateModule( slug ) );
			}
		};
	}
)( DashMonitor );