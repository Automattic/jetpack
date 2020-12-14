/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { dateI18n } from '@wordpress/date';
import { __, _x, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import ConnectButton from 'components/connect-button';
import getRedirectUrl from 'lib/jp-redirect';
import { numberFormat } from 'components/number-format';

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
							{ _x( 'Views today', 'Referring to a number of page views', 'jetpack' ) }
						</p>
						<h3 className="jp-at-a-glance__stat-number">{ s.viewsToday }</h3>
					</div>
					<div className="jp-at-a-glance__stats-summary-bestday">
						<p className="jp-at-a-glance__stat-details">
							{ _x( 'Best overall day', 'Referring to a number of page views', 'jetpack' ) }
						</p>
						<h3 className="jp-at-a-glance__stat-number">
							{ '-' === s.bestDay.count
								? '-'
								: sprintf(
										_n( '%s View', '%s Views', s.bestDay.count, 'jetpack' ),
										numberFormat( s.bestDay.count )
								  ) }
						</h3>
						<p className="jp-at-a-glance__stat-details">
							{ '-' === s.bestDay.day ? '-' : dateI18n( this.props.dateFormat, s.bestDay.day ) }
						</p>
					</div>
					<div className="jp-at-a-glance__stats-summary-alltime">
						<div className="jp-at-a-glance__stats-alltime-views">
							<p className="jp-at-a-glance__stat-details">
								{ _x( 'All-time views', 'Referring to a number of page views', 'jetpack' ) }
							</p>
							<h3 className="jp-at-a-glance__stat-number">
								{ '-' === s.allTime.views ? '-' : numberFormat( s.allTime.views ) }
							</h3>
						</div>
						<div className="jp-at-a-glance__stats-alltime-comments">
							<p className="jp-at-a-glance__stat-details">
								{ _x( 'All-time comments', 'Referring to a number of comments', 'jetpack' ) }
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
						{ createInterpolateElement( __( '<button>View detailed stats</button>', 'jetpack' ), {
							button: (
								<Button
									onClick={ this.trackViewDetailedStats }
									href={ this.props.siteAdminUrl + 'admin.php?page=stats' }
								/>
							),
						} ) }
						{ this.props.isLinked &&
							createInterpolateElement(
								__( '<button>View more stats on WordPress.com </button>', 'jetpack' ),
								{
									button: (
										<Button
											onClick={ this.trackViewWpcomStats }
											className="is-primary"
											href={ getRedirectUrl( 'calypso-stats-insights', {
												site: this.props.siteRawUrl,
											} ) }
										/>
									),
								}
							) }
					</div>
				</div>
				{ ! this.props.isLinked && (
					<Card compact className="jp-settings-card__configure-link">
						<ConnectButton
							connectUser={ true }
							from="unlinked-user-connect"
							connectLegend={ __(
								'Connect your account to WordPress.com to view more stats',
								'jetpack'
							) }
						/>
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
	dateFormat: PropTypes.string.isRequired,
};

DashStatsBottom.defaultProps = {
	siteRawUrl: '',
	siteAdminUrl: '',
	statsData: {},
	isLinked: false,
	dateFormat: 'F j, Y',
};

export default DashStatsBottom;
