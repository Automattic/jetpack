/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'lib/mixins/i18n';

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
		const labelName = __( 'Downtime Monitoring' );

		if ( this.props.isModuleActivated( 'monitor' ) ) {
			const lastDowntime = this.props.getLastDownTime();

			if ( lastDowntime === 'N/A' ) {
				return(
					<DashItem label={ labelName } status="is-working">
						<QueryLastDownTime />
						<p className="jp-dash-item__description">{ __( 'Loading' ) }&#8230;</p>
					</DashItem>
				);
			}

			return(
				<DashItem label={ labelName } status="is-working">
					<p className="jp-dash-item__description">{ __( 'Monitor is on and is watching your site.' ) }</p>
					<p className="jp-dash-item__description">
						{
							__( 'Last downtime was %(time)s ago.', {
								args: {
									time: lastDowntime.date
								}
							} )
						}
					</p>
				</DashItem>
			);
		}

		return(
			<DashItem label={ labelName } className="jp-dash-item__is-inactive">
				<p className="jp-dash-item__description">
					{
						__( '{{a}}Activate Monitor{{/a}} to receive notifications if your site goes down.', {
							components: {
								a:<a href="javascript:void(0)" onClick={ this.props.activateMonitor } />
							}
						} )
					}
				</p>
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
