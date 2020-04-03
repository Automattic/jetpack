/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from 'components/button';
import analytics from 'lib/analytics';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import { numberFormat, moment, translate as __ } from 'i18n-calypso';

class DashStatsBottom extends Component {
	statsBottom() {
		let generalStats;
		if ( 'object' === typeof this.props.statsData.general ) {
			generalStats = this.props.statsData.general.stats;
		} else {
			generalStats = {
				views: '-',
				comments: '-',
				views_today: '-',
				views_best_day: '-',
				views_best_day_total: '-',
			};
		}
		return [
			{
				viewsToday: generalStats.views_today,
				bestDay: {
					day: generalStats.views_best_day,
					count: generalStats.views_best_day_total,
				},
				allTime: {
					views: generalStats.views,
					comments: generalStats.comments,
				},
			},
		];
	}

	trackViewDetailedStats = () => analytics.tracks.recordJetpackClick( 'view_detailed_stats' );

	trackViewWpcomStats = () => analytics.tracks.recordJetpackClick( 'view_wpcom_stats' );

	render() {
		const s = this.statsBottom()[ 0 ];

		return (
			<div>
				<div className="jp-at-a-glance__stats-summary">
					<div className="jp-at-a-glance__stats-summary-today">
						<p className="jp-at-a-glance__stat-details">
							{ __( 'Views today', { comment: 'Referring to a number of page views' } ) }
						</p>
						<h3 className="jp-at-a-glance__stat-number">{ s.viewsToday }</h3>
					</div>
					<div className="jp-at-a-glance__stats-summary-bestday">
						<p className="jp-at-a-glance__stat-details">
							{ __( 'Best overall day', { comment: 'Referring to a number of page views' } ) }
						</p>
						<h3 className="jp-at-a-glance__stat-number">
							{ '-' === s.bestDay.count
								? '-'
								: __( '%(number)s View', '%(number)s Views', {
										count: s.bestDay.count,
										args: {
											number: numberFormat( s.bestDay.count ),
										},
								  } ) }
						</h3>
						<p className="jp-at-a-glance__stat-details">
							{ '-' === s.bestDay.day ? '-' : moment( s.bestDay.day ).format( 'MMMM Do, YYYY' ) }
						</p>
					</div>
					<div className="jp-at-a-glance__stats-summary-alltime">
						<div className="jp-at-a-glance__stats-alltime-views">
							<p className="jp-at-a-glance__stat-details">
								{ __( 'All-time views', { comment: 'Referring to a number of page views' } ) }
							</p>
							<h3 className="jp-at-a-glance__stat-number">
								{ '-' === s.allTime.views ? '-' : numberFormat( s.allTime.views ) }
							</h3>
						</div>
						<div className="jp-at-a-glance__stats-alltime-comments">
							<p className="jp-at-a-glance__stat-details">
								{ __( 'All-time comments', { comment: 'Referring to a number of comments' } ) }
							</p>
							<h3 className="jp-at-a-glance__stat-number">
								{ '-' === s.allTime.comments ? '-' : numberFormat( s.allTime.comments ) }
							</h3>
						</div>
					</div>
				</div>
				<div className="jp-at-a-glance__stats-cta">
					<div className="jp-at-a-glance__stats-cta-description" />
					<div className="jp-at-a-glance__stats-cta-buttons">
						{ __( '{{button}}View detailed stats{{/button}}', {
							components: {
								button: (
									<Button
										onClick={ this.trackViewDetailedStats }
										href={ this.props.siteAdminUrl + 'admin.php?page=stats' }
									/>
								),
							},
						} ) }
						{ this.props.isLinked &&
							__( '{{button}}View more stats on WordPress.com {{/button}}', {
								components: {
									button: (
										<Button
											onClick={ this.trackViewWpcomStats }
											className="is-primary"
											href={ getRedirectUrl( 'calypso-stats-insights', {
												site: this.props.siteRawUrl,
											} ) }
										/>
									),
								},
							} ) }
					</div>
				</div>
				{ ! this.props.isLinked && (
					<Card
						compact
						className="jp-settings-card__configure-link"
						href={ `${ this.props.connectUrl }&from=unlinked-user-connect` }
					>
						{ __( 'Connect your account to WordPress.com to view more stats' ) }
					</Card>
				) }
			</div>
		);
	}
}

DashStatsBottom.propTypes = {
	siteRawUrl: PropTypes.string.isRequired,
	siteAdminUrl: PropTypes.string.isRequired,
	statsData: PropTypes.object.isRequired,
	isLinked: PropTypes.bool.isRequired,
};

DashStatsBottom.defaultProps = {
	siteRawUrl: '',
	siteAdminUrl: '',
	statsData: {},
	isLinked: false,
};

export default DashStatsBottom;
