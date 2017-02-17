/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import SEO from './seo';
import Ads from './ads';
import SiteStats from './site-stats';
import RelatedPosts from './related-posts';
import VerificationServices from './verification-services';
import { getLastPostUrl } from 'state/initial-state';

export const Traffic = React.createClass( {
	displayName: 'TrafficSettings',

	render() {
		return (
			<div>
				<QuerySite />
				<SEO
					configureUrl={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl }
				/>
				<Ads
					configureUrl={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl }
				/>
				<SiteStats />
				<RelatedPosts
					configureUrl={
						this.props.siteAdminUrl +
						'customize.php?autofocus[section]=jetpack_relatedposts' +
						'&return=' + encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
						'&url=' + encodeURIComponent( this.props.lastPostUrl )
					}
				/>
				<VerificationServices />
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			lastPostUrl: getLastPostUrl( state )
		};
	}
)( Traffic );
