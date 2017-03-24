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
import { isModuleFound as _isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import { SEO } from './seo';
import { GoogleAnalytics } from './google-analytics';
import { Ads } from './ads';
import { SiteStats } from './site-stats';
import { RelatedPosts } from './related-posts';
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

		const found = {
			seo: this.props.isModuleFound( 'seo-tools' ),
			ads: this.props.isModuleFound( 'wordads' ),
			stats: this.props.isModuleFound( 'stats' ),
			related: this.props.isModuleFound( 'related-posts' ),
			verification: this.props.isModuleFound( 'verification-tools' ),
			sitemaps: this.props.isModuleFound( 'sitemaps' ),
			analytics: this.props.isModuleFound( 'google-analytics' )
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if (
			! found.seo &&
			! found.ads &&
			! found.stats &&
			! found.related &&
			! found.verification &&
			! found.sitemaps &&
			! found.analytics
		) {
			return null;
		}

		const seoSettings = (
			<SEO
				{ ...commonProps }
				configureUrl={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl }
			/>
		);
		const adSettings = (
			<Ads
				{ ...commonProps }
				configureUrl={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl }
			/>
		);
		const statsSettings = (
			<SiteStats
				{ ...commonProps }
			/>
		);
		const relatedPostsSettings = (
			<RelatedPosts
				{ ...commonProps }
				configureUrl={ this.props.siteAdminUrl +
					'customize.php?autofocus[section]=jetpack_relatedposts' +
					'&return=' + encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
					'&url=' + encodeURIComponent( this.props.lastPostUrl ) }
			/>
		);

		const googleAnalyticsSettings = (
			<GoogleAnalytics
				{ ...commonProps }
				configureUrl={ 'https://wordpress.com/settings/analytics/' + this.props.siteRawUrl }
			/>
		);

		const sitemaps = (
			<Sitemaps
				{ ...commonProps }
			/>
		);

		const verificationSettings = (
			<VerificationServices
				{ ...commonProps }
			/>
		);

		return (
			<div>
				<QuerySite />
				{ found.seo && seoSettings }
				{ found.ads && adSettings }
				{ found.stats && statsSettings }
				{ found.related && relatedPostsSettings }
				{ found.analytics && googleAnalyticsSettings }
				{ found.verification && verificationSettings }
				{ found.sitemaps && sitemaps }
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
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			lastPostUrl: getLastPostUrl( state )
		};
	}
)( Traffic );
