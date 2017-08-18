/**
 * External dependencies
 */
import React, { Component } from 'react';
import forEach from 'lodash/forEach';
import get from 'lodash/get';
import Card from 'components/card';
import Chart from 'components/chart';
import { connect } from 'react-redux';
import DashSectionHeader from 'components/dash-section-header';
import Button from 'components/button';
import Spinner from 'components/spinner';
import { numberFormat, moment, translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants';
import { isDevMode, isCurrentUserLinked, getConnectUrl } from 'state/connection';
import {
	getInitialStateStatsData
} from 'state/initial-state';
import QueryStatsData from 'components/data/query-stats-data';
import DashStatsBottom from './dash-stats-bottom';
import {
	getStatsData,
	statsSwitchTab,
	fetchStatsData,
	getActiveStatsTab as _getActiveStatsTab
} from 'state/at-a-glance';
import { getModules } from 'state/modules';
import { emptyStatsCardDismissed } from 'state/settings';

class DashStats extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			emptyStatsDismissed: props.isEmptyStatsCardDismissed,
		};
	}

	barClick( bar ) {
		if ( bar.data.link ) {
			analytics.tracks.recordJetpackClick( 'stats_bar' );
			window.open(
				bar.data.link,
				'_blank'
			);
		}
	}

	statsChart( unit ) {
		const props = this.props,
			s = [];

		let totalViews = 0;

		if ( 'object' !== typeof props.statsData[ unit ] ) {
			return { chartData: s, totalViews: false };
		}

		forEach( props.statsData[ unit ].data, function( v ) {
			const views = v[ 1 ];
			let date = v[ 0 ],
				chartLabel = '',
				tooltipLabel = '';

			// Increment total views for the period
			totalViews += views;

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
				value: views,
				nestedValue: null,
				className: 'statsChartbar',
				data: {
					link: `https://wordpress.com/stats/${ unit }/${ props.siteRawUrl }?startDate=${ date }`
				},
				tooltipData: [ {
					label: tooltipLabel,
					value: __( 'Views: %(numberOfViews)s', { args: { numberOfViews: numberFormat( views ) } } ),
					className: 'tooltip class'
				}, { label: __( 'Click to view detailed stats.' ) } ]
			} );
		} );

		return { chartData: s, totalViews: totalViews };
	}

	/**
	 * Checks that the stats fetching didn't return errors.
	 *
	 * @returns {object|bool} Returns statsData.general.errors or false if it is not an object
	 */
	statsErrors() {
		return get( this.props.statsData, [ 'general', 'errors' ], false );
	}

	renderStatsChart( chartData ) {
		return (
			<div>
				<div className="jp-at-a-glance__stats-chart">
					<Chart data={ chartData } barClick={ this.barClick } />
					{
						0 < chartData.length ? '' : <Spinner />
					}
				</div>
				<div id="stats-bottom" className="jp-at-a-glance__stats-bottom">
					<DashStatsBottom
						statsData={ this.props.statsData }
						siteRawUrl={ this.props.siteRawUrl }
						siteAdminUrl={ this.props.siteAdminUrl }
						isLinked={ this.props.isLinked }
						connectUrl={ this.props.connectUrl }
					/>
				</div>
			</div>
		);
	}

	renderEmptyStatsCard() {
		const dismissCard = () => {
			this.setState( { emptyStatsDismissed: true } );
			this.props.updateOptions( { dismiss_empty_stats_card: true } );
		};
		return (
			<Card className="jp-at-a-glance__stats-empty">
				<img src={ imagePath + 'stats-people.svg' } width="272" height="144" alt={ __( 'Jetpack Stats People' ) } className="jp-at-a-glance__stats-icon" />
				<p>
					{ __( 'Hello there! Your stats have been activated.' ) }
					<br />
					{ __( 'Just give us a little time to collect data so we can display it for you here.' ) }
				</p>
				<Button
					onClick={ dismissCard }
					primary={ true }
				>
					{ __( 'Okay, got it!' ) }
				</Button>
			</Card>
		);
	}

	renderStatsArea() {
		const activateStats = () => this.props.updateOptions( { stats: true } );

		if ( this.props.getOptionValue( 'stats' ) ) {
			const statsErrors = this.statsErrors();
			if ( statsErrors ) {
				return (
					<div className="jp-at-a-glance__stats-inactive">
						<span>
							{
								__( 'Something happened while loading stats. Please try again later or {{a}}view your stats now on WordPress.com{{/a}}', {
									components: {
										a: <a href={ 'https://wordpress.com/stats/insights/' + this.props.siteRawUrl } />
									}
								} )
							}
						</span>
					</div>
				);
			}

			const statsChart = this.statsChart( this.props.activeTab() ),
				chartData = statsChart.chartData,
				totalViews = statsChart.totalViews,
				showEmptyStats = chartData.length > 0 && totalViews <= 0 && ! this.props.isEmptyStatsCardDismissed && ! this.state.emptyStatsDismissed;

			return (
				<div className="jp-at-a-glance__stats-container">
					{ ! showEmptyStats ? this.renderStatsChart( chartData ) : this.renderEmptyStatsCard() }
				</div>
			);
		}

		return (
			<div className="jp-at-a-glance__stats-inactive">
				<div className="jp-at-a-glance__stats-inactive-icon">
					<img src={ imagePath + 'stats.svg' } width="60" height="60" alt={ __( 'Jetpack Stats Icon' ) } className="jp-at-a-glance__stats-icon" />
				</div>
				<div className="jp-at-a-glance__stats-inactive-text">
					{
						this.props.isDevMode ? __( 'Unavailable in Dev Mode' )
							: __( '{{a}}Activate Site Stats{{/a}} to see detailed stats, likes, followers, subscribers, and more! {{a1}}Learn More{{/a1}}', {
								components: {
									a: <a href="javascript:void(0)" onClick={ activateStats } />,
									a1: <a href="https://jetpack.com/support/wordpress-com-stats/" target="_blank" rel="noopener noreferrer" />
								}
							} )
					}
				</div>
				{
					this.props.isDevMode ? '' : (
						<div className="jp-at-a-glance__stats-inactive-button">
							<Button
								onClick={ activateStats }
								primary={ true }
							>
								{ __( 'Activate Site Stats' ) }
							</Button>
						</div>
					)
				}
			</div>
		);
	}

	maybeShowStatsTabs() {
		const switchToDay = () => {
				analytics.tracks.recordJetpackClick( { target: 'stats_switch_view', view: 'day' } );
				this.props.switchView( 'day' );
				this.props.fetchStatsData( 'day' );
			},
			switchToWeek = () => {
				analytics.tracks.recordJetpackClick( { target: 'stats_switch_view', view: 'week' } );
				this.props.switchView( 'week' );
				this.props.fetchStatsData( 'week' );
			},
			switchToMonth = () => {
				analytics.tracks.recordJetpackClick( { target: 'stats_switch_view', view: 'month' } );
				this.props.switchView( 'month' );
				this.props.fetchStatsData( 'month' );
			};

		if ( this.props.getOptionValue( 'stats' ) && ! this.statsErrors() ) {
			return (
				<ul className="jp-at-a-glance__stats-views">
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ switchToDay }
							className={ this.getClass( 'day' ) }
						>{ __( 'Days' ) }</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ switchToWeek }
							className={ this.getClass( 'week' ) }
						>{ __( 'Weeks' ) }</a>
					</li>
					<li tabIndex="0" className="jp-at-a-glance__stats-view">
						<a href="javascript:void(0)" onClick={ switchToMonth }
							className={ this.getClass( 'month' ) }
						>{ __( 'Months' ) }</a>
					</li>
				</ul>
			);
		}
	}

	getClass( view ) {
		return this.props.activeTab() === view
			? 'jp-at-a-glance__stats-view-link is-current'
			: 'jp-at-a-glance__stats-view-link';
	}

	render() {
		const moduleList = Object.keys( this.props.moduleList );
		if ( ! includes( moduleList, 'stats' ) ) {
			return null;
		}

		const range = this.props.activeTab();
		return (
			<div>
				<QueryStatsData range={ range } />
				<DashSectionHeader label={ __( 'Site Stats' ) }>
					{ this.maybeShowStatsTabs() }
				</DashSectionHeader>
				<Card className={ 'jp-at-a-glance__stats-card ' + ( this.props.isDevMode ? 'is-inactive' : '' ) }>
					{ this.renderStatsArea() }
				</Card>
			</div>
		);
	}
}

DashStats.propTypes = {
	isDevMode: React.PropTypes.bool.isRequired,
	siteRawUrl: React.PropTypes.string.isRequired,
	siteAdminUrl: React.PropTypes.string.isRequired,
	statsData: React.PropTypes.any.isRequired
};

export default connect(
	( state ) => {
		return {
			moduleList: getModules( state ),
			activeTab: () => _getActiveStatsTab( state ),
			isDevMode: isDevMode( state ),
			isLinked: isCurrentUserLinked( state ),
			connectUrl: getConnectUrl( state ),
			statsData: getStatsData( state ) !== 'N/A' ? getStatsData( state ) : getInitialStateStatsData( state ),
			isEmptyStatsCardDismissed: emptyStatsCardDismissed( state ),
		};
	},
	( dispatch ) => {
		return {
			switchView: ( tab ) => {
				return dispatch( statsSwitchTab( tab ) );
			},
			fetchStatsData: ( range ) => {
				return dispatch( fetchStatsData( range ) );
			}
		};
	}
)( DashStats );
