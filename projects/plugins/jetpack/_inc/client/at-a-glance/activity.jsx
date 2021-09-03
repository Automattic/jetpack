/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { isEmpty, get } from 'lodash';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import DashItem from 'components/dash-item';
import { getSiteActivity } from 'state/activity';
import { getSitePlan } from 'state/site';
import { isOfflineMode } from 'state/connection';
//import { PLAN_JETPACK_BUSINESS, PLAN_JETPACK_BUSINESS_MONTHLY, PLAN_VIP } from 'lib/plans/constants';

class DashActivity extends Component {
	static propTypes = {
		inOfflineMode: PropTypes.bool.isRequired,
		siteRawUrl: PropTypes.string.isRequired,
		sitePlan: PropTypes.object.isRequired,
		siteActivity: PropTypes.array.isRequired,
	};

	static defaultProps = {
		inOfflineMode: false,
		siteRawUrl: '',
		sitePlan: '',
		siteActivity: [],
	};

	render() {
		const { inOfflineMode, siteActivity } = this.props;
		// const sitePlan = get( this.props.sitePlan, 'product_slug', 'jetpack_free' );
		// const hasBackups = includes( [ PLAN_JETPACK_BUSINESS, PLAN_JETPACK_BUSINESS_MONTHLY, PLAN_VIP ], sitePlan );
		// const maybeUpgrade = hasBackups
		// 	? __( "{{a}}View your site's activity{{/a}} in a single feed where you can see when events occur and rewind them if you need to.", {
		// 		components: {
		// 			a: activityLogLink
		// 		}
		// 	} )
		// 	: __( "{{a}}View your site's activity{{/a}} in a single feed where you can see when events occur and, {{plan}}with a plan{{/plan}}, rewind them if you need to.", {
		// 		components: {
		// 			a: activityLogLink,
		// 			plan: <a href={ `https://jetpack.com/redirect/?source=plans-main-bottom&site=${ siteRawUrl }` } />
		// 		}
		// 	} );

		const activityLogOnlyText = isEmpty( siteActivity ) ? (
			<p>
				{
					// @todo: update this to use rewind text/CTA when available
					__(
						'Jetpack keeps a complete record of everything that happens on your site, taking the guesswork out of site management, debugging, and repair.',
						'jetpack'
					)
				}
			</p>
		) : (
			<ul className="jp-dash-activity__list">
				{ siteActivity.map(
					( { summary, content: { text }, actor: { name, icon }, published }, index ) => (
						<li key={ `activity-event-${ index }` }>
							<time dateTime={ published } className="jp-dash-activity__date-time">
								<div className="jp-dash-activity__date">{ dateI18n( 'MMM D', published ) }</div>
								<div className="jp-dash-activity__time">{ dateI18n( 'HH:mm', published ) }</div>
							</time>
							<div className="jp-dash-activity__item">
								<div className="jp-dash-activity__event">{ text }</div>
								<div className="jp-dash-activity__details">
									<div className="jp-dash-activity__actor">
										{ icon && <img src={ get( icon, 'url', '' ) } alt="" /> }
										<span className="jp-dash-activity__actor-name">{ name }</span>
									</div>
									<div className="jp-dash-activity__summary">{ summary }</div>
								</div>
							</div>
						</li>
					)
				) }
			</ul>
		);

		return (
			<div className="jp-dash-item__interior">
				<DashItem
					label={ __( 'Activity', 'jetpack' ) }
					isModule={ false }
					className={ classNames( {
						'jp-dash-item__is-inactive': inOfflineMode,
					} ) }
					pro={ false }
				>
					<div className="jp-dash-item__description">
						{ inOfflineMode
							? __( 'Unavailable in Offline Mode.', 'jetpack' )
							: activityLogOnlyText }
					</div>
				</DashItem>
				<Card
					key="view-activity"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
				>
					{ __( 'View all site activity', 'jetpack' ) }
				</Card>
			</div>
		);
	}
}

export default connect( state => ( {
	sitePlan: getSitePlan( state ),
	inOfflineMode: isOfflineMode( state ),
	siteActivity: getSiteActivity( state ),
} ) )( DashActivity );
