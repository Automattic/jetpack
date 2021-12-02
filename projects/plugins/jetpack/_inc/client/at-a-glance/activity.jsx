/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import DashItem from 'components/dash-item';
import { getSitePlan } from 'state/site';
import { isOfflineMode } from 'state/connection';
//import { PLAN_JETPACK_BUSINESS, PLAN_JETPACK_BUSINESS_MONTHLY, PLAN_VIP } from 'lib/plans/constants';

class DashActivity extends Component {
	static propTypes = {
		inOfflineMode: PropTypes.bool.isRequired,
		siteRawUrl: PropTypes.string.isRequired,
		sitePlan: PropTypes.object.isRequired,
	};

	static defaultProps = {
		inOfflineMode: false,
		siteRawUrl: '',
		sitePlan: '',
	};

	render() {
		const { inOfflineMode } = this.props;
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

		// @todo: update this to use rewind text/CTA when available
		const activityLogOnlyText = __(
			'Jetpack keeps a complete record of everything that happens on your site, taking the guesswork out of site management, debugging, and repair.',
			'jetpack'
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
					<p className="jp-dash-item__description">
						{ inOfflineMode
							? __( 'Unavailable in Offline Mode.', 'jetpack' )
							: activityLogOnlyText }
					</p>
				</DashItem>
				<Card
					key="view-activity"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
				>
					{ __( 'View site activity', 'jetpack' ) }
				</Card>
			</div>
		);
	}
}

export default connect( state => ( {
	sitePlan: getSitePlan( state ),
	inOfflineMode: isOfflineMode( state ),
} ) )( DashActivity );
