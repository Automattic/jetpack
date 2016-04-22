/**
 * External dependencies
 */
var React = require( 'react' );
var forEach  = require( 'lodash/foreach' );
var Chart = require( 'components/chart' );
var Tabs = require( 'components/tabs' );

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
		return s;
	},

	render: function() {
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
					<DashStatsBottom />
				</div>
			</div>
		)
	}
} );

const DashStatsBottom = React.createClass( {
	statsBottom: function() {
		const generalStats = window.Initial_State.statsData.general.stats;
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

module.exports = DashStats;