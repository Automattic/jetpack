/**
 * External dependencies
 */
import React from 'react';
import Button from 'components/button';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { numberFormat, moment, translate as __ } from 'i18n-calypso';

const DashStatsBottom = React.createClass( {
	statsBottom: function() {
		let generalStats;
		if ( 'object' === typeof this.props.statsData.general ) {
			generalStats = this.props.statsData.general.stats;
		} else {
			generalStats = {
				views: '-',
				comments: '-',
				views_today: '-',
				views_best_day: '-',
				views_best_day_total: '-'
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
							'-' === s.bestDay.count ? '-' :
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
							'-' === s.bestDay.day ? '-' : moment( s.bestDay.day ).format( 'MMMM Do, YYYY' )
						}
					</p>
				</div>
				<div className="jp-at-a-glance__stats-summary-alltime">
					<div className="jp-at-a-glance__stats-alltime-views">
						<p className="jp-at-a-glance__stat-details">{ __( 'All-time views', { comment: 'Referring to a number of page views' } ) }</p>
						<h3 className="jp-at-a-glance__stat-number">
							{
								'-' === s.allTime.views ? '-' : numberFormat( s.allTime.views )
							}
						</h3>
					</div>
					<div className="jp-at-a-glance__stats-alltime-comments">
						<p className="jp-at-a-glance__stat-details">{ __( 'All-time comments', { comment: 'Referring to a number of comments' } ) }</p>
						<h3 className="jp-at-a-glance__stat-number">
							{
								'-' === s.allTime.comments ? '-' : numberFormat( s.allTime.comments )
							}
						</h3>
					</div>
				</div>
			</div>
			<div className="jp-at-a-glance__stats-cta">
				<div className="jp-at-a-glance__stats-cta-description">
				</div>
				<div className="jp-at-a-glance__stats-cta-buttons">
					{ __( '{{button}}View More Stats{{/button}}', {
						components: {
							button:
								<Button
									onClick={ () => analytics.tracks.recordEvent( 'jetpack_wpa_aag_stats_wpcom_click', {} ) }
									className="is-primary"
									href={ 'https://wordpress.com/stats/insights/' + this.props.siteRawUrl }
								/>
						}
					} ) }
				</div>
			</div>
		</div>
		);
	}
} );

export default DashStatsBottom;
