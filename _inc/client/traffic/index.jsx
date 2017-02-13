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
import { isDevMode, isUnavailableInDevMode } from 'state/connection';
import QuerySite from 'components/data/query-site';
import { SEO } from './seo';
import { Ads } from './ads';
import { SiteStats } from './site-stats';
import { RelatedPosts } from './related-posts';
import { VerificationServices } from './verification-services';
import { getLastPostUrl } from 'state/initial-state';

export const Traffic = React.createClass( {
	displayName: 'TrafficSettings',

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode
		};
		return (
			<div>
				<QuerySite />
				<SEO
					{ ...commonProps }
					configureUrl={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl }
				/>
				<Ads
					{ ...commonProps }
					configureUrl={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl }
				/>
				<SiteStats
					{ ...commonProps }
				/>
				<RelatedPosts
					{ ...commonProps }
					configureUrl={ this.props.siteAdminUrl +
						'customize.php?autofocus[section]=jetpack_relatedposts' +
						'&return=' + encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
						'&url=' + encodeURIComponent( this.props.lastPostUrl ) }
				/>
				<VerificationServices
					{ ...commonProps }
				/>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: module_name => getModule( state, module_name ),
			settings: getSettings( state ),
			isDevMode: isDevMode( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
			lastPostUrl: getLastPostUrl( state )
		}
	}
)( Traffic );
