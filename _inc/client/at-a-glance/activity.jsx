/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import get from 'lodash/get';
import includes from 'lodash/includes';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { getSitePlan } from 'state/site';
import { isAtomicSite } from 'state/initial-state';
import { isDevMode } from 'state/connection';
import { PLAN_JETPACK_BUSINESS, PLAN_JETPACK_BUSINESS_MONTHLY } from 'lib/plans/constants';

class DashActivity extends Component {
	static propTypes = {
		inDevMode: PropTypes.bool.isRequired,
		siteRawUrl: PropTypes.string.isRequired,
		sitePlan: PropTypes.object.isRequired
	};

	static defaultProps = {
		inDevMode: false,
		siteRawUrl: '',
		sitePlan: ''
	};

	render() {
		const { siteRawUrl, inDevMode, isAtomicSite } = this.props;
		const sitePlan = get( this.props.sitePlan, 'product_slug', 'jetpack_free' );
		const activityLogLink = <a href={ `https://wordpress.com/stats/activity/${ siteRawUrl }` } />;
		const hasBackups = isAtomicSite || includes( [ PLAN_JETPACK_BUSINESS, PLAN_JETPACK_BUSINESS_MONTHLY ], sitePlan );
		const maybeUpgrade = hasBackups
			? __( "{{a}}View your site's activity{{/a}} in a single feed where you can see when events occur and rewind them if you need to.", {
				components: {
					a: activityLogLink
				}
			} )
			: __( "{{a}}View your site's activity{{/a}} in a single feed where you can see when events occur and, {{plan}}with a plan{{/plan}}, rewind them if you need to.", {
				components: {
					a: activityLogLink,
					plan: <a href={ `https://jetpack.com/redirect/?source=plans-main-bottom&site=${ siteRawUrl }` } />
				}
			} );

		return (
			<div className="jp-dash-item__interior">
				<DashItem
					label={ __( 'Activity' ) }
					isModule={ false }
					className={ classNames( {
						'jp-dash-item__is-inactive': inDevMode
					} ) }
					pro={ ! hasBackups }
					>
					<p className="jp-dash-item__description">
						{
							inDevMode
								? __( 'Unavailable in Dev Mode.' )
								: maybeUpgrade
						}
					</p>
				</DashItem>
			</div>
		);
	}
}

export default connect(
	state => ( {
		sitePlan: getSitePlan( state ),
		inDevMode: isDevMode( state ),
		isAtomicSite: isAtomicSite( state ),
	} )
)( DashActivity );
