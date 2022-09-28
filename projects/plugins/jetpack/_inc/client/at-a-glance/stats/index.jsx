import { imagePath } from 'constants/urls';
import { getRedirectUrl, numberFormat } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import Card from 'components/card';
import Chart from 'components/chart';
import DashSectionHeader from 'components/dash-section-header';
import QueryStatsData from 'components/data/query-stats-data';
import ModuleOverriddenBanner from 'components/module-overridden-banner';
import analytics from 'lib/analytics';
import { forEach, get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getStatsData, statsSwitchTab, fetchStatsData, getActiveStatsTab } from 'state/at-a-glance';
import { isOfflineMode, isCurrentUserLinked, getConnectUrl } from 'state/connection';
import { getInitialStateStatsData, getDateFormat } from 'state/initial-state';
import { isModuleAvailable, getModuleOverride } from 'state/modules';
import { emptyStatsCardDismissed } from 'state/settings';
import DashStatsBottom from './dash-stats-bottom';

export class DashStats extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool.isRequired,
		siteRawUrl: PropTypes.string.isRequired,
		siteAdminUrl: PropTypes.string.isRequired,
		statsData: PropTypes.any.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
	};

	constructor( props ) {
		super( props );
		this.state = {
			emptyStatsDismissed: props.isEmptyStatsCardDismissed,
		};
	}

	barClick( bar ) {
		if ( bar.data.link ) {
			analytics.tracks.recordJetpackClick( 'stats_bar' );
			window.open( bar.data.link, '_blank' );
		}
	}

	statsChart( unit ) {
		const props = this.props,
			s = [];

		let totalViews = 0;

		const /* translators: short date format, such as: Jan 12. */
			shortMonthFormat = __( 'M j', 'jetpack' ),
			/* translators: long date format, such as: January 12th. */
			longMonthFormat = __( 'F jS', 'jetpack' ),
			/* translators: long month/year format, such as: January, 2021. */
			longMonthYearFormat = __( 'F Y', 'jetpack' );

		if ( 'object' !== typeof props.statsData[ unit ] ) {
			return { chartData: s, totalViews: false };
		}

		forEach( props.statsData[ unit ].data, function ( v ) {
			const views = v[ 1 ];
			let date = v[ 0 ],
				chartLabel = '',
				tooltipLabel = '';

			// Increment total views for the period
			totalViews += views;

			if ( 'day' === unit ) {
				chartLabel = dateI18n( shortMonthFormat, date );
				tooltipLabel = dateI18n( longMonthFormat, date );
			} else if ( 'week' === unit ) {
				date = date.replace( /W/g, '-' );
				chartLabel = dateI18n( shortMonthFormat, date );
				tooltipLabel = sprintf(
					/* translators: placeholder is a date. */
					__( 'Week of %s', 'jetpack' ),
					dateI18n( longMonthFormat, date )
				);
			} else if ( 'month' === unit ) {
				chartLabel = dateI18n( 'M', date );
				tooltipLabel = dateI18n( longMonthYearFormat, date );
			}

			s.push( {
				label: chartLabel,
				value: views,
				nestedValue: null,
				className: 'statsChartbar',
				data: {
					link: getRedirectUrl( `calypso-stats-${ unit }`, {
						site: props.siteRawUrl,
						query: `startDate=${ date }`,
					} ),
				},
				tooltipData: [
					{
						label: tooltipLabel,
						value: sprintf(
							/* translators: placeholder is a number */
							__( 'Views: %s', 'jetpack' ),
							numberFormat( views )
						),
						className: 'tooltip class',
					},
					{ label: __( 'Click to view detailed stats.', 'jetpack' ) },
				],
			} );
		} );

		return { chartData: s, totalViews: totalViews };
	}

	/**
	 * Checks that the stats fetching didn't return errors.
	 *
	 * @returns {object|boolean} Returns statsData.general.errors or false if it is not an object
	 */
	statsErrors() {
		return get( this.props.statsData, [ 'general', 'errors' ], false );
	}

	renderStatsChart( chartData ) {
		return (
			<div>
				<div className="jp-at-a-glance__stats-chart">
					<Chart data={ chartData } barClick={ this.barClick } />
					{ 0 === chartData.length && <Spinner /> }
				</div>
				<div id="stats-bottom" className="jp-at-a-glance__stats-bottom">
					<DashStatsBottom
						statsData={ this.props.statsData }
						siteRawUrl={ this.props.siteRawUrl }
						siteAdminUrl={ this.props.siteAdminUrl }
						isLinked={ this.props.isLinked }
						connectUrl={ this.props.connectUrl }
						dateFormat={ this.props.dateFormat }
					/>
				</div>
			</div>
		);
	}

	dismissCard = () => {
		this.setState( { emptyStatsDismissed: true } );
		this.props.updateOptions( { dismiss_empty_stats_card: true } );
	};

	renderEmptyStatsCard() {
		return (
			<Card className="jp-at-a-glance__stats-empty">
				<img
					src={ imagePath + 'stats-people.svg' }
					width="272"
					height="144"
					alt={ __( 'Jetpack Stats People', 'jetpack' ) }
					className="jp-at-a-glance__stats-icon"
				/>
				<p>
					{ __( 'Hello there! Your stats have been activated.', 'jetpack' ) }
					<br />
					{ __(
						'Just give us a little time to collect data so we can display it for you here.',
						'jetpack'
					) }
				</p>
				<Button onClick={ this.dismissCard } primary>
					{ __( 'Okay, got it!', 'jetpack' ) }
				</Button>
			</Card>
		);
	}

	activateStats = e => {
		this.props.updateOptions( { stats: true } );
		e.preventDefault();
	};

	renderStatsArea() {
		if ( this.props.getOptionValue( 'stats' ) ) {
			if ( this.statsErrors() ) {
				return (
					<div className="jp-at-a-glance__stats-inactive">
						<span>
							{ createInterpolateElement(
								__(
									'Something happened while loading stats. Please try again later or <a>view your stats now on WordPress.com</a>',
									'jetpack'
								),
								{
									a: (
										<a
											href={ getRedirectUrl( 'calypso-stats-insights', {
												site: this.props.siteRawUrl,
											} ) }
										/>
									),
								}
							) }
						</span>
					</div>
				);
			}

			const statsChart = this.statsChart( this.props.activeTab ),
				chartData = statsChart.chartData,
				totalViews = statsChart.totalViews,
				showEmptyStats =
					chartData.length &&
					totalViews <= 0 &&
					! this.props.isEmptyStatsCardDismissed &&
					! this.state.emptyStatsDismissed;

			return (
				<div className="jp-at-a-glance__stats-container">
					{ showEmptyStats ? this.renderEmptyStatsCard() : this.renderStatsChart( chartData ) }
				</div>
			);
		}

		return (
			<div className="jp-at-a-glance__stats-inactive">
				<div className="jp-at-a-glance__stats-inactive-icon">
					<img
						src={ imagePath + 'stats.svg' }
						width="60"
						height="60"
						alt={ __( 'Jetpack Stats Icon', 'jetpack' ) }
						className="jp-at-a-glance__stats-icon"
					/>
				</div>
				<div className="jp-at-a-glance__stats-inactive-text">
					{ this.props.isOfflineMode
						? __( 'Unavailable in Offline Mode', 'jetpack' )
						: createInterpolateElement(
								__(
									'<a>Activate Site Stats</a> to see detailed stats, likes, followers, subscribers, and more! <a1>Learn More</a1>',
									'jetpack'
								),
								{
									a: <a href="#" onClick={ this.activateStats } />,
									a1: (
										<a
											href={ getRedirectUrl( 'jetpack-support-wordpress-com-stats' ) }
											target="_blank"
											rel="noopener noreferrer"
										/>
									),
								}
						  ) }
				</div>
				{ ! this.props.isOfflineMode && (
					<div className="jp-at-a-glance__stats-inactive-button">
						<Button onClick={ this.activateStats } primary>
							{ __( 'Activate Site Stats', 'jetpack' ) }
						</Button>
					</div>
				) }
			</div>
		);
	}

	switchTo( timeFrame ) {
		analytics.tracks.recordJetpackClick( { target: 'stats_switch_view', view: timeFrame } );
		this.props.switchView( timeFrame );
		this.props.fetchStatsData( timeFrame );
	}

	switchToDay = e => {
		this.switchTo( 'day' );
		e.preventDefault();
	};
	switchToWeek = e => {
		this.switchTo( 'week' );
		e.preventDefault();
	};
	switchToMonth = e => {
		this.switchTo( 'month' );
		e.preventDefault();
	};

	maybeShowStatsTabs() {
		const statsChart = this.statsChart( this.props.activeTab );

		if (
			false === statsChart.totalViews &&
			! this.props.isEmptyStatsCardDismissed &&
			! this.state.emptyStatsDismissed
		) {
			return false;
		}

		if ( this.props.getOptionValue( 'stats' ) && ! this.statsErrors() ) {
			return (
				<ul className="jp-at-a-glance__stats-views">
					<li className="jp-at-a-glance__stats-view">
						<a
							tabIndex="0"
							href="#"
							onClick={ this.switchToDay }
							className={ this.getClass( 'day' ) }
						>
							{ __( 'Days', 'jetpack' ) }
						</a>
					</li>
					<li className="jp-at-a-glance__stats-view">
						<a
							tabIndex="0"
							href="#"
							onClick={ this.switchToWeek }
							className={ this.getClass( 'week' ) }
						>
							{ __( 'Weeks', 'jetpack' ) }
						</a>
					</li>
					<li className="jp-at-a-glance__stats-view">
						<a
							tabIndex="0"
							href="#"
							onClick={ this.switchToMonth }
							className={ this.getClass( 'month' ) }
						>
							{ __( 'Months', 'jetpack' ) }
						</a>
					</li>
				</ul>
			);
		}
	}

	getClass( view ) {
		return this.props.activeTab === view
			? 'jp-at-a-glance__stats-view-link is-current'
			: 'jp-at-a-glance__stats-view-link';
	}

	render() {
		if ( 'inactive' === this.props.getModuleOverride( 'stats' ) ) {
			return (
				<div>
					<ModuleOverriddenBanner moduleName={ __( 'Site Stats', 'jetpack' ) } />
				</div>
			);
		}
		return (
			this.props.isModuleAvailable && (
				<div>
					<QueryStatsData range={ this.props.activeTab } />
					<DashSectionHeader label={ __( 'Site Stats', 'jetpack' ) }>
						{ this.maybeShowStatsTabs() }
					</DashSectionHeader>
					<Card
						className={
							'jp-at-a-glance__stats-card ' + ( this.props.isOfflineMode ? 'is-inactive' : '' )
						}
					>
						{ this.renderStatsArea() }
					</Card>
				</div>
			)
		);
	}
}

export default connect(
	state => ( {
		isModuleAvailable: isModuleAvailable( state, 'stats' ),
		activeTab: getActiveStatsTab( state ),
		dateFormat: getDateFormat( state ),
		isOfflineMode: isOfflineMode( state ),
		isLinked: isCurrentUserLinked( state ),
		connectUrl: getConnectUrl( state ),
		statsData: isEmpty( getStatsData( state ) )
			? getInitialStateStatsData( state )
			: getStatsData( state ),
		isEmptyStatsCardDismissed: emptyStatsCardDismissed( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	} ),
	dispatch => ( {
		switchView: tab => dispatch( statsSwitchTab( tab ) ),
		fetchStatsData: range => dispatch( fetchStatsData( range ) ),
	} )
)( DashStats );
