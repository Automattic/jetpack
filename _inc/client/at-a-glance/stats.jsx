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
import Spinner from 'components/spinner';
import { numberFormat, moment, translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants';
import { isDevMode } from 'state/connection';
import QueryStatsData from 'components/data/query-stats-data';
import {
	getStatsData,
	statsSwitchTab,
	fetchStatsData,
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

		if ( 'object' !== typeof window.Initial_State.stats.data[unit] ) {
			return s;
		}

		forEach( window.Initial_State.stats.data[unit].data, function( v ) {
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
		return s;
	},

	/**
	 * Checks that the stats fetching didn't return errors.
	 *
	 * @returns {object|bool}
	 */
	statsErrors() {
		if ( 'object' !== typeof window.Initial_State.stats.data.general ) {
			return false;
		}
		if ( 'undefined' === typeof window.Initial_State.stats.data.general.errors ) {
			return false;
		}
		return window.Initial_State.stats.data.general.errors;
	},

	renderStatsArea: function() {
		if ( this.props.isModuleActivated( 'stats' ) ) {
			let statsErrors = this.statsErrors();
			if ( statsErrors ) {
				forEach( statsErrors, function( error ) {
					console.log( error );
				} );
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
			let chartData = this.statsChart( this.props.activeTab() );
			return (
				<div className="jp-at-a-glance__stats-container">
					<div className="jp-at-a-glance__stats-chart">
						<Chart data={ chartData } barClick={ this.barClick } />
						{
							0 < chartData.length ? '': <Spinner />
						}
					</div>
					<div id="stats-bottom" className="jp-at-a-glance__stats-bottom">
						<DashStatsBottom { ...this.props } />
					</div>
				</div>
			);
		} else {
			return (
				<div className="jp-at-a-glance__stats-inactive">
					<div className="jp-at-a-glance__stats-inactive-icon">
						<img src={ imagePath + 'stats.svg' } width="60" height="60" alt={ __( 'Jetpack Stats Icon' ) } className="jp-at-a-glance__stats-icon" />
					</div>
					<div className="jp-at-a-glance__stats-inactive-text">
						{
							isDevMode( this.props ) ? __( 'Unavailable in Dev Mode' ) :
							__( '{{a}}Activate Site Statistics{{/a}} to see detailed stats, likes, followers, subscribers, and more! {{a1}}Learn More{{/a1}}', {
								components: {
									a: <a href="javascript:void(0)" onClick={ this.props.activateStats } />,
									a1: <a href="https://jetpack.com/support/wordpress-com-stats/" target="_blank" />
								}
							} )
						}
					</div>
						{
							isDevMode( this.props ) ? '' : (
								<div className="jp-at-a-glance__stats-inactive-button">
									<Button
										onClick={ this.props.activateStats }
										primary={ true }
									>
										{ __( 'Activate Site Statistics' ) }
									</Button>
								</div>
							)
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
		this.props.fetchStatsData( view );
	},

	getClass: function( view ) {
		return this.props.activeTab() === view ?
			'jp-at-a-glance__stats-view-link is-current' :
			'jp-at-a-glance__stats-view-link';
	},

	render: function() {
		let range = this.props.activeTab();
		if ( 'object' !== typeof window.Initial_State.stats.data[ range ] || 'N/A' === window.Initial_State.stats.data[ range ] ) {
			let statsData = this.props.getStatsData();
			if ( 'object' !== typeof window.Initial_State.stats.data.general ) {
				window.Initial_State.stats.data = statsData;
			} else {
				window.Initial_State.stats.data.general = statsData.general;
				window.Initial_State.stats.data[ range ] = statsData[ range ];
			}
		}
		return (
			<div>
				<QueryStatsData range={ range } />
				<DashSectionHeader label={ __( 'Site Statistics' ) }>
					{ this.maybeShowStatsTabs() }
				</DashSectionHeader>
				<Card className={ 'jp-at-a-glance__stats-card ' + ( isDevMode( this.props ) ? 'is-inactive': '' ) }>
					{ this.renderStatsArea() }
				</Card>
			</div>
		);
	}
} );

const DashStatsBottom = React.createClass( {
	statsBottom: function() {
		let generalStats;
		if ( 'object' === typeof window.Initial_State.stats.data.general ) {
			generalStats = window.Initial_State.stats.data.general.stats;
		} else {
			generalStats = {
				'views': '-',
				'comments': '-',
				'views_today': '-',
				'views_best_day': '-',
				'views_best_day_total': '-'
			}
		}
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
					<p className="jp-at-a-glance__stat-details">{ __( 'Views today', { comment: 'Referring to a number of page views' } ) }</p>
					<h3 className="jp-at-a-glance__stat-number">{ s.viewsToday }</h3>
				</div>
				<div className="jp-at-a-glance__stats-summary-bestday">
					<p className="jp-at-a-glance__stat-details">{ __( 'Best overall day', { comment: 'Referring to a number of page views' } ) }</p>
					<h3 className="jp-at-a-glance__stat-number">
						{
							'-' === s.bestDay.count ? '-':
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
					<p className="jp-at-a-glance__stat-details">
						{
							'-' === s.bestDay.day ? '-': moment( s.bestDay.day ).format( 'MMMM Do, YYYY' )
						}
					</p>
				</div>
				<div className="jp-at-a-glance__stats-summary-alltime">
					<div className="jp-at-a-glance__stats-alltime-views">
						<p className="jp-at-a-glance__stat-details">{ __( 'All-time views', { comment: 'Referring to a number of page views' } ) }</p>
						<h3 className="jp-at-a-glance__stat-number">
							{
								'-' === s.allTime.views ? '-': numberFormat( s.allTime.views )
							}
						</h3>
					</div>
					<div className="jp-at-a-glance__stats-alltime-comments">
						<p className="jp-at-a-glance__stat-details">{ __( 'All-time comments', { comment: 'Referring to a number of comments' } ) }</p>
						<h3 className="jp-at-a-glance__stat-number">
							{
								'-' === s.allTime.comments ? '-': numberFormat( s.allTime.comments )
							}
						</h3>
					</div>
				</div>
			</div>
			<div className="jp-at-a-glance__stats-cta">
				<div className="jp-at-a-glance__stats-cta-description">
					<p></p>
				</div>
				<div className="jp-at-a-glance__stats-cta-buttons">
					{ __( '{{button}}View more stats{{/button}}', {
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
			activeTab: () => _getActiveStatsTab( state ),
			getStatsData: () => getStatsData( state )
		};
	},
	( dispatch ) => {
		return {
			activateStats: () => {
				return dispatch( activateModule( 'stats' ) );
			},
			switchView: ( tab ) => {
				return dispatch( statsSwitchTab( tab ) );
			},
			fetchStatsData: ( range ) => {
				return dispatch( fetchStatsData( range ) );
			}
		};
	}
)( DashStats );
