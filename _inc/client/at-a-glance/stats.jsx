/**
 * External dependencies
 */
import React from 'react';
import forEach from 'lodash/forEach';
import Card from 'components/card';
import Chart from 'components/chart';
import { connect } from 'react-redux';
import DashSectionHeader from 'components/dash-section-header';
import Button from 'components/button';

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
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';

const DashStats = React.createClass( {
	statsChart: function( unit ) {
		let s = [];
		forEach( window.Initial_State.statsData[unit].data, function( v ) {
			let label = v[0];
			let views = v[1];
			s.push( {
				label: label,
				value: views,
				nestedValue: null,
				className: 'statsChartbar',
				data: {},
				tooltipData: [ {
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
				<div className="jp-at-a-glance__stats-container">
					<div className="jp-at-a-glance__stats-chart">
						<Chart data={ this.statsChart( activeTab ) } />
					</div>
					<div id="stats-bottom" className="jp-at-a-glance__stats-bottom">
						<DashStatsBottom { ...this.props } />
					</div>
				</div>
			);
		} else {
			return (
				<div><a href="javascript:void(0)" onClick={ this.props.activateStats } >Activate Site Statistics</a> to see detailed stats, likes, followers, subscribers, and more!</div>
			);
		}
	},

	maybeShowStatsTabs: function() {
		if ( this.props.isModuleActivated( 'stats' ) ) {
			return(
				<ul className="jp-at-a-glance__stats-views">
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ this.handleSwitchStatsView.bind( this, 'day' ) }
							className={ this.getClass( 'day' ) }
						>Days</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ this.handleSwitchStatsView.bind( this, 'week' ) }
							className={ this.getClass( 'week' ) }
						>Weeks</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ this.handleSwitchStatsView.bind( this, 'month' ) }
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
		return activeTab === view ?
			'jp-at-a-glance__stats-view-link is-current' :
			'jp-at-a-glance__stats-view-link';
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
			<div className="jp-at-a-glance__stats-summary">
				<div className="jp-at-a-glance__stats-summary-today">
					<p className="jp-at-a-glance__stat-details">Views today</p>
					<h3 className="jp-at-a-glance__stat-number">{ s.viewsToday }</h3>
				</div>
				<div className="jp-at-a-glance__stats-summary-bestday">
					<p className="jp-at-a-glance__stat-details">Best overall day</p>
					<h3 className="jp-at-a-glance__stat-number">{ s.bestDay.count } Views</h3>
					<p className="jp-at-a-glance__stat-details">{ s.bestDay.day }</p>
				</div>
				<div className="jp-at-a-glance__stats-summary-alltime">
					<div className="jp-at-a-glance__stats-alltime-views">
						<p className="jp-at-a-glance__stat-details">All-time views</p>
						<h3 className="jp-at-a-glance__stat-number">{ s.allTime.views }</h3>
					</div>
					<div className="jp-at-a-glance__stats-alltime-comments">
						<p className="jp-at-a-glance__stat-details">All-time comments</p>
						<h3 className="jp-at-a-glance__stat-number">{ s.allTime.comments }</h3>
					</div>
				</div>
			</div>
			<div className="jp-at-a-glance__stats-cta">
				<div className="jp-at-a-glance__stats-cta-description">
					<p>Need to see more stats, likes, followers, subscribers, and more?</p>
				</div>
				<div className="jp-at-a-glance__stats-cta-buttons">
					<Button href="?page=stats">View old stats</Button>
					<Button className="is-primary" href={ 'https://wordpress.com/stats/insights/' + window.Initial_State.rawUrl }>View enhanced stats on WordPress.com</Button>
				</div>
			</div>
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
