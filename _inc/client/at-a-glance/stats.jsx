/**
 * External dependencies
 */
import React from 'react';
import forEach  from 'lodash/foreach';
import Card from 'components/card';
import Chart from 'components/chart';
import Tabs from 'components/tabs';
import { connect } from 'react-redux';
import DashSectionHeader from 'components/dash-section-header';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus } from 'state/connection';
import { demoStatsData, demoStatsBottom } from 'devmode';
import {
	statsSwitchTab,
	getActiveStatsTab as _getActiveStatsTab
} from 'state/at-a-glance';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule,
	isFetchingModulesList as _isFetchingModulesList
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
			const activeTab = this.props.activeTab();
			return (
				<div>
					<Chart data={ this.statsChart( activeTab ) } />
					<div id="stats-bottom">
						<h2>more gen stats area...</h2>
						<DashStatsBottom { ...this.props } />
					</div>
				</div>
			);
		} else {
			return (
				<div>please <a onClick={ this.props.activateStats }>activate stats</a> to unlock awesomeness</div>
			);
		}
	},

	maybeShowStatsTabs: function() {
		if ( this.props.isModuleActivated( 'stats' ) ) {
			return(
				<ul className="jp-at-a-glance__stats-views">
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a onClick={ this.handleSwitchStatsView.bind( this, 'day' ) }
						   className={ this.getClass( 'day' ) }
						>Days</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a onClick={ this.handleSwitchStatsView.bind( this, 'week' ) }
						   className={ this.getClass( 'week' ) }
						>Weeks</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a onClick={ this.handleSwitchStatsView.bind( this, 'month' ) }
						   className={ this.getClass( 'month' ) }
						>Months</a>
					</li>
				</ul>
			);
		}
	},

	handleSwitchStatsView: function( view ) {
		this.props.switchView( view );
	},

	getClass: function( view ) {
		const activeTab = this.props.activeTab();
		return activeTab === view
			? 'jp-at-a-glance__stats-view-link is-current'
			: 'jp-at-a-glance__stats-view-link';
	},

	render: function() {
		return(
			<div>
				<DashSectionHeader
					label="Site Statistics"
					settingsPath="#engagement"
				>
					{ this.maybeShowStatsTabs() }
				</DashSectionHeader>
				<Card>
					{ this.renderStatsArea() }
				</Card>
			</div>
		)
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
			getModule: ( module_name ) => _getModule( state, module_name ),
			isFetchingModules: () => _isFetchingModulesList( state ),
			activeTab: () => _getActiveStatsTab( state )
		};
	},
	( dispatch ) => {
		return {
			activateStats: () => {
				return dispatch( activateModule( 'stats' ) );
			},
			switchView: ( tab ) => {
				return dispatch( statsSwitchTab( tab ) );
			}
		};
	}
)( DashStats );
