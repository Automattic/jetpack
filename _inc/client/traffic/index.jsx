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
import { isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import { SEO } from './seo';
import { GoogleAnalytics } from './google-analytics';
import { Ads } from './ads';
import { SiteStats } from './site-stats';
import { RelatedPosts } from './related-posts';
import Search from './search';
import { VerificationServices } from './verification-services';
import Sitemaps from './sitemaps';
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

		const foundSeo = this.props.isModuleFound( 'seo-tools' ),
			foundAds = this.props.isModuleFound( 'wordads' ),
			foundStats = this.props.isModuleFound( 'stats' ),
			foundRelated = this.props.isModuleFound( 'related-posts' ),
			foundVerification = this.props.isModuleFound( 'verification-tools' ),
			foundSitemaps = this.props.isModuleFound( 'sitemaps' ),
			foundSearch = false, // this.props.isModuleFound( 'search' ),
			foundAnalytics = this.props.isModuleFound( 'google-analytics' );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if (
			! foundSeo &&
			! foundAds &&
			! foundStats &&
			! foundRelated &&
			! foundVerification &&
			! foundSitemaps &&
			! foundAnalytics &&
			! foundSearch
		) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				{
					foundStats && (
						<SiteStats
							{ ...commonProps }
						/>
					)
				}
				{
					foundAds && (
						<Ads
							{ ...commonProps }
							configureUrl={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl }
						/>
					)
				}
				{
					foundRelated && (
						<RelatedPosts
							{ ...commonProps }
							configureUrl={ this.props.siteAdminUrl +
						'customize.php?autofocus[section]=jetpack_relatedposts' +
						'&return=' + encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
						'&url=' + encodeURIComponent( this.props.lastPostUrl ) }
						/>
					)
				}
				{
					foundSeo && (
						<SEO
							{ ...commonProps }
							configureUrl={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl }
						/>
					)
				}
				{
					foundAnalytics && (
						<GoogleAnalytics
							{ ...commonProps }
							configureUrl={ 'https://wordpress.com/settings/analytics/' + this.props.siteRawUrl }
						/>
					)
				}
				{
					foundSitemaps && (
						<Sitemaps
							{ ...commonProps }
						/>
					)
				}
				{
					foundVerification && (
						<VerificationServices
							{ ...commonProps }
						/>
					)
				}
				{
					foundSearch && (
						<Search
							{ ...commonProps }
						/>
					)
				}
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
			isModuleFound: ( module_name ) => isModuleFound( state, module_name ),
			lastPostUrl: getLastPostUrl( state )
		};
	}
)( Traffic );
