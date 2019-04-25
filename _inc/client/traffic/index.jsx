/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getModule, getModuleOverride } from 'state/modules';
import { getSettings } from 'state/settings';
import { isSiteConnected, isDevMode, isUnavailableInDevMode } from 'state/connection';
import { isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import { SEO } from './seo';
import { GoogleAnalytics } from './google-analytics';
import { Ads } from './ads';
import { SiteStats } from './site-stats';
import Shortlinks from './shortlinks';
import { RelatedPosts } from './related-posts';
import { VerificationServices } from './verification-services';
import Sitemaps from './sitemaps';
import { getLastPostUrl } from 'state/initial-state';

export class Traffic extends React.Component {
	static displayName = 'TrafficSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			siteRawUrl: this.props.siteRawUrl,
			getModule: this.props.module,
			isSiteConnected: this.props.isSiteConnected,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode,
			getModuleOverride: this.props.getModuleOverride,
		};

		const foundSeo = this.props.isModuleFound( 'seo-tools' ),
			foundAds = this.props.isModuleFound( 'wordads' ),
			foundStats = this.props.isModuleFound( 'stats' ),
			foundShortlinks = this.props.isModuleFound( 'shortlinks' ),
			foundRelated = this.props.isModuleFound( 'related-posts' ),
			foundVerification = this.props.isModuleFound( 'verification-tools' ),
			foundSitemaps = this.props.isModuleFound( 'sitemaps' ),
			foundAnalytics = this.props.isModuleFound( 'google-analytics' );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if (
			! foundSeo &&
			! foundAds &&
			! foundStats &&
			! foundShortlinks &&
			! foundRelated &&
			! foundVerification &&
			! foundSitemaps &&
			! foundAnalytics
		) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<Card
					title={
						this.props.searchTerm
							? __( 'Traffic' )
							: __(
									'Maximize your site’s visibility in search engines and view traffic stats in real time.'
							  )
					}
					className="jp-settings-description"
				/>
				{ foundAds && (
					<Ads
						{ ...commonProps }
						configureUrl={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl }
					/>
				) }
				{ foundRelated && (
					<RelatedPosts
						{ ...commonProps }
						configureUrl={
							this.props.siteAdminUrl +
							'customize.php?autofocus[section]=jetpack_relatedposts' +
							'&return=' +
							encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
							'&url=' +
							encodeURIComponent( this.props.lastPostUrl )
						}
					/>
				) }
				{ foundSeo && (
					<SEO
						{ ...commonProps }
						configureUrl={
							'https://wordpress.com/settings/traffic/' + this.props.siteRawUrl + '#seo'
						}
					/>
				) }
				{ foundAnalytics && (
					<GoogleAnalytics
						{ ...commonProps }
						configureUrl={
							'https://wordpress.com/settings/traffic/' + this.props.siteRawUrl + '#analytics'
						}
					/>
				) }
				{ foundStats && <SiteStats { ...commonProps } /> }
				{ foundShortlinks && <Shortlinks { ...commonProps } /> }
				{ foundSitemaps && <Sitemaps { ...commonProps } /> }
				{ foundVerification && <VerificationServices { ...commonProps } /> }
			</div>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		settings: getSettings( state ),
		isDevMode: isDevMode( state ),
		isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		isSiteConnected: isSiteConnected( state ),
		lastPostUrl: getLastPostUrl( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( Traffic );
