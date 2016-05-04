/**
 * External dependencies
 */
var React = require( 'react' );
var forEach  = require( 'lodash/foreach' );
var Chart = require( 'components/chart' );
var Tabs = require( 'components/tabs' );
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus } from 'state/connection';
import { demoStatsData, demoStatsBottom } from 'devmode';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	deactivateModule,
	isActivatingModule,
	isDeactivatingModule,
	getModule as _getModule
} from 'state/modules';

const DashStats = React.createClass( {
	statsChart: function( unit ) {
		let s = [];
		forEach( window.Initial_State.statsData[unit].data, function( v ) {
			let label = v[0];
			let views = v[1];
			s.push( {
				'label': label,
				'value': views,
				'nestedValue': null,
				'className': 'statsChartbar',
				'data': {},
				'tooltipData': [ {
					label: label,
					value: 'Views: ' + views,
					link: null,
					icon: '',
					className: 'tooltip class'
				} ]
			} );
		} );
		return ( getSiteConnectionStatus( this.props ) === 'dev' ) ? demoStatsData : s;
	},

	renderStatsArea: function() {
		if ( this.props.isModuleActivated( 'stats' ) ) {
			return (
				<div>
					<Tabs>
						<Tabs.Panel title="Days">
							<Chart data={ this.statsChart( 'day' ) } />
						</Tabs.Panel>
						<Tabs.Panel title="Weeks">
							<Chart data={ this.statsChart( 'week' ) } />
						</Tabs.Panel>
						<Tabs.Panel title="Months">
							<Chart data={ this.statsChart( 'month' ) } />
						</Tabs.Panel>
					</Tabs>
					<div id="stats-bottom">
						<h2>more gen stats area...</h2>
						<DashStatsBottom { ...this.props } />
					</div>
				</div>
			);
		} else {
			return <div>please activate stats</div>;
		}
	},

	render: function() {
		console.log( this.props );
		return this.renderStatsArea();
	}
} );

const DashStatsBottom = React.createClass( {
	statsBottom: function() {
		const generalStats = ( getSiteConnectionStatus( this.props ) === 'dev' ) ? demoStatsBottom : window.Initial_State.statsData.general.stats;
		return [
			{
				viewsToday: generalStats.views_today,
				bestDay: {
					day: generalStats.views_best_day,
					count: generalStats.views_best_day_total
				},
				allTime: {
					views: generalStats.views,
					comments: generalStats.comments
				}
			}
		];
	},

	render: function() {
		const s = this.statsBottom()[0];
		return (
			<div>
				<div>Views Today: { s.viewsToday }</div>
				<div>Best Ever day: { s.bestDay.day }</div>
				<div>Best Ever count: { s.bestDay.count }</div>
				<div>All Time views: { s.allTime.views }</div>
				<div>All Time comments: { s.allTime.comments }</div>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			getModule: ( module_name ) => _getModule( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			activateModule: () => {
				return dispatch( activateModule( 'stats' ) );
			}
		};
	}
)( DashStats );