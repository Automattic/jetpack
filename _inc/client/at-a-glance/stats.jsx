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
import { numberFormat, moment, translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus, isDevMode } from 'state/connection';
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
	barClick: function( bar ) {
		if ( bar.data.link ) {
			window.open(
				bar.data.link,
				'_blank'
			);
		}
	},

	statsChart: function( unit ) {
		let s = [];
		forEach( window.Initial_State.statsData[unit].data, function( v ) {
			let date = v[0];
			let chartLabel = '';
			let tooltipLabel = '';
			let views = v[1];

			if ( 'day' === unit ) {
				chartLabel = moment( date ).format( 'MMM D' );
				tooltipLabel = moment( date ).format( 'MMMM Do' );
			} else if ( 'week' === unit ) {
				date = date.replace( /W/g, '-' );
				chartLabel = moment( date ).format( 'MMM D' );
				tooltipLabel = __( 'Week of %(date)s', { args: { date: moment( date ).format( 'MMMM Do' ) } } );
			} else if ( 'month' ) {
				chartLabel = moment( date ).format( 'MMM' );
				tooltipLabel = moment( date ).format( 'MMMM, YYYY' );
			}

			s.push( {
				label: chartLabel,
				value: numberFormat( views ),
				nestedValue: null,
				className: 'statsChartbar',
				data: {
					link: `https://wordpress.com/stats/${ unit }/${ window.Initial_State.rawUrl }?startDate=${ date }`
				},
				tooltipData: [ {
					label: tooltipLabel,
					value: __( 'Views: %(numberOfViews)s', { args: { numberOfViews: numberFormat( views ) } } ),
					className: 'tooltip class'
				}, { label: __( 'Click to view detailed stats.' ) } ]
			} );
		} );
		return ( getSiteConnectionStatus( this.props ) === 'dev' ) ? demoStatsData : s;
	},

	/**
	 * Checks that the stats fetching didn't return errors.
	 *
	 * @returns {object|bool}
	 */
	statsErrors() {
		let checkStats = window.Initial_State.statsData.general;
		if ( 'object' === typeof checkStats.errors ) {
			return checkStats.errors;
		}
		return false;
	},

	renderStatsArea: function() {
		if ( this.props.isModuleActivated( 'stats' ) ) {
			let statsErrors = this.statsErrors();
			if ( statsErrors ) {
				forEach( statsErrors, function( error ) {
					console.log( error );
				} );
				if ( getSiteConnectionStatus( this.props ) === 'dev' ) {
					return (
						<p>
							{
								__( 'Error loading stats. See JavaScript console for logs.' )
							}
						</p>
					);
				}
				return (
					<p>
						{
							__( 'Something happened while loading stats. Please try again later or {{a}}view your stats now on WordPress.com{{/a}}', {
								components: {
									a: <a href="{ 'https://wordpress.com/stats/insights/' + window.Initial_State.rawUrl }" />
								}
							} )
						}
					</p>
				);
			}
			const activeTab = this.props.activeTab();
			return (
				<div className="jp-at-a-glance__stats-container">
					<div className="jp-at-a-glance__stats-chart">
						<Chart
							data={ this.statsChart( activeTab ) }
							barClick={ this.barClick }
						/>
					</div>
					<div id="stats-bottom" className="jp-at-a-glance__stats-bottom">
						<DashStatsBottom { ...this.props } />
					</div>
				</div>
			);
		} else {
			return (
				<div>
					{
						isDevMode( this.props ) ? __( 'Unavailable in Dev Mode' ) :
						__( '{{a}}Activate Site Statistics{{/a}} to see detailed stats, likes, followers, subscribers, and more!', {
							components: {
								a: <a href="javascript:void(0)" onClick={ this.props.activateStats } />
							}
						} )
					}
				</div>
			);
		}
	},

	maybeShowStatsTabs: function() {
		if ( this.props.isModuleActivated( 'stats' ) && ! this.statsErrors() ) {
			return(
				<ul className="jp-at-a-glance__stats-views">
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ this.handleSwitchStatsView.bind( this, 'day' ) }
							className={ this.getClass( 'day' ) }
						>{ __( 'Days' ) }</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ this.handleSwitchStatsView.bind( this, 'week' ) }
							className={ this.getClass( 'week' ) }
						>{ __( 'Weeks' ) }</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ this.handleSwitchStatsView.bind( this, 'month' ) }
							className={ this.getClass( 'month' ) }
						>{ __( 'Months' ) }</a>
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
				>
					{ this.maybeShowStatsTabs() }
				</DashSectionHeader>
				<Card className={ 'jp-at-a-glance__stats-card ' + ( isDevMode( this.props ) ? 'is-inactive': '' ) }>
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
		const bestDay = s.bestDay.day;
		return (
		<div>
			<div className="jp-at-a-glance__stats-summary">
				<div className="jp-at-a-glance__stats-summary-today">
					<p className="jp-at-a-glance__stat-details">{ __( 'Views today', { comment: 'Referring to a number of page views' } ) }</p>
					<h3 className="jp-at-a-glance__stat-number">{ s.viewsToday }</h3>
				</div>
				<div className="jp-at-a-glance__stats-summary-bestday">
					<p className="jp-at-a-glance__stat-details">{ __( 'Best overall day', { comment: 'Referring to a number of page views' } ) }</p>
					<h3 className="jp-at-a-glance__stat-number">
						{
							__( '%(number)s View', '%(number)s Views',
								{
									count: s.bestDay.count,
									args: {
										number: numberFormat( s.bestDay.count )
									}
								}
							)
						}
					</h3>
					<p className="jp-at-a-glance__stat-details">{ moment( bestDay ).format( 'MMMM Do, YYYY' ) }</p>
				</div>
				<div className="jp-at-a-glance__stats-summary-alltime">
					<div className="jp-at-a-glance__stats-alltime-views">
						<p className="jp-at-a-glance__stat-details">{ __( 'All-time views', { comment: 'Referring to a number of page views' } ) }</p>
						<h3 className="jp-at-a-glance__stat-number">{ numberFormat( s.allTime.views ) }</h3>
					</div>
					<div className="jp-at-a-glance__stats-alltime-comments">
						<p className="jp-at-a-glance__stat-details">{ __( 'All-time comments', { comment: 'Referring to a number of comments' } ) }</p>
						<h3 className="jp-at-a-glance__stat-number">{ numberFormat( s.allTime.comments ) }</h3>
					</div>
				</div>
			</div>
			<div className="jp-at-a-glance__stats-cta">
				<div className="jp-at-a-glance__stats-cta-description">
					<p>{ __( 'Need to see more stats, likes, followers, subscribers, and more?' ) }</p>
				</div>
				<div className="jp-at-a-glance__stats-cta-buttons">
					{ __( '{{button}}View old stats{{/button}}', { components: { button: <Button href="?page=stats" /> } } ) }
					{ __( '{{button}}View enhanced stats on WordPress.com{{/button}}', {
						components: { button: <Button className="is-primary" href={ 'https://wordpress.com/stats/insights/' + window.Initial_State.rawUrl } /> }
					} ) }
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
