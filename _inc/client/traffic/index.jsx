/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getModule, getModuleOverride } from 'state/modules';
import getRedirectUrl from 'lib/jp-redirect';
import { getSettings } from 'state/settings';
import { isSiteConnected, isOfflineMode, isUnavailableInOfflineMode } from 'state/connection';
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
import { getLastPostUrl, isAtomicSite } from 'state/initial-state';

export class Traffic extends React.Component {
	static displayName = 'TrafficSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			siteRawUrl: this.props.siteRawUrl,
			getModule: this.props.module,
			isSiteConnected: this.props.isSiteConnected,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
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
							? __( 'Traffic', 'jetpack' )
							: __(
									'Maximize your site’s visibility in search engines and view traffic stats in real time.',
									'jetpack'
							  )
					}
					className="jp-settings-description"
				/>
				{ foundAds && (
					<Ads
						{ ...commonProps }
						isAtomicSite={ this.props.isAtomicSite }
						configureUrl={ getRedirectUrl( 'calypso-stats-ads-day', {
							site: this.props.siteRawUrl,
						} ) }
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
						configureUrl={ getRedirectUrl( 'calypso-marketing-traffic', {
							site: this.props.siteRawUrl,
							anchor: 'seo',
						} ) }
					/>
				) }
				{ foundAnalytics && (
					<GoogleAnalytics
						{ ...commonProps }
						configureUrl={ getRedirectUrl( 'calypso-marketing-traffic', {
							site: this.props.siteRawUrl,
							anchor: 'analytics',
						} ) }
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
		isOfflineMode: isOfflineMode( state ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		isSiteConnected: isSiteConnected( state ),
		lastPostUrl: getLastPostUrl( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
		isAtomicSite: isAtomicSite( state ),
	};
} )( Traffic );
