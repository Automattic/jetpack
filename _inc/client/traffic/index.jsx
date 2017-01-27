/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import QuerySite from 'components/data/query-site';
import { SEO } from './seo';
import GoogleAnalytics from './google-analytics';
import { SiteStats } from './site-stats';
import { RelatedPosts } from './related-posts';
import { VerificationServices } from './verification-services';
import { getLastPostUrl } from 'state/initial-state';

export const Traffic = React.createClass( {
	displayName: 'TrafficSettings',

	render() {
		return (
			<div>
				<QuerySite />
				<SEO
					settings={ this.props.settings }
					getModule={ this.props.module }
					configureUrl={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl }
				/>
				<SiteStats
					settings={ this.props.settings }
					getModule={ this.props.module }
				/>
				<RelatedPosts
					settings={ this.props.settings }
					getModule={ this.props.module }
					configureUrl={ this.props.siteAdminUrl +
						'customize.php?autofocus[section]=jetpack_relatedposts' +
						'&return=' + encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
						'&url=' + encodeURIComponent( this.props.lastPostUrl ) }
				/>
				<VerificationServices
					settings={ this.props.settings }
					getModule={ this.props.module }
				/>
				<GoogleAnalytics settings={ this.props.settings } getModule={ this.props.module } />
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			settings: getSettings( state ),
			lastPostUrl: getLastPostUrl( state )
		}
	}
)( Traffic );
