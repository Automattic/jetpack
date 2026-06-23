import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData, isWoASite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import QuerySite from 'components/data/query-site';
import SimpleNotice from 'components/notice';
import {
	isSiteConnected,
	isOfflineMode,
	isUnavailableInOfflineMode,
	hasConnectedOwner,
} from 'state/connection';
import { getLastPostUrl, currentThemeIsBlockTheme, getSiteId } from 'state/initial-state';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import { siteUsesWpAdminInterface } from 'state/site';
import Blaze from './blaze';
import { GoogleAnalytics } from './google-analytics';
import { RelatedPosts } from './related-posts';
import SEO from './seo';
import Shortlinks from './shortlinks';
import { SiteStats } from './site-stats';
import Sitemaps from './sitemaps';
import { VerificationServices } from './verification-services';

export class Traffic extends Component {
	static displayName = 'TrafficSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			siteRawUrl: this.props.siteRawUrl,
			getModule: this.props.module,
			isBlockThemeActive: this.props.isBlockThemeActive,
			isSiteConnected: this.props.isSiteConnected,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			getModuleOverride: this.props.getModuleOverride,
			hasConnectedOwner: this.props.hasConnectedOwner,
			lastPostUrl: this.props.lastPostUrl,
			siteAdminUrl: this.props.siteAdminUrl,
			siteUsesWpAdminInterface: this.props.siteUsesWpAdminInterface,
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		const foundSeo = this.props.isModuleFound( 'seo-tools' ),
			foundCanonicalUrls = this.props.isModuleFound( 'canonical-urls' ),
			foundStats = this.props.isModuleFound( 'stats' ),
			foundShortlinks = this.props.isModuleFound( 'shortlinks' ),
			foundRelated = this.props.isModuleFound( 'related-posts' ),
			foundVerification = this.props.isModuleFound( 'verification-tools' ),
			foundSitemaps = this.props.isModuleFound( 'sitemaps' ),
			foundAnalytics = isWoASite(),
			foundBlaze = this.props.isModuleFound( 'blaze' );

		// Once the site is on the new SEO experience (fresh install / opted-in /
		// WordPress.com), the SEO, Sitemaps, and Verification sections live in the
		// dedicated SEO dashboard, so hide those legacy sections here and point to the
		// new page. Existing self-hosted installs that haven't opted in keep them
		// (JETPACK-1682).
		const seoMovedToDashboard = getScriptData()?.seo?.surface_visible === true;
		// The pointer notice stands in for every section we hide, so show it whenever
		// any of them would have rendered — including a settings search for "sitemap"
		// or "verification" that matches even when the SEO section itself does not.
		const foundMovedToDashboard =
			foundSeo || foundCanonicalUrls || foundSitemaps || foundVerification;

		if (
			! foundSeo &&
			! foundCanonicalUrls &&
			! foundStats &&
			! foundShortlinks &&
			! foundRelated &&
			! foundVerification &&
			! foundSitemaps &&
			! foundAnalytics &&
			! foundBlaze
		) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Traffic Settings', 'jetpack' ) }</h1>
				<h2 className="jp-settings__section-title">
					{ this.props.searchTerm
						? __( 'Traffic', 'jetpack' )
						: __(
								'Maximize your site’s visibility in search engines and view traffic patterns in real time.',
								'jetpack'
						  ) }
				</h2>
				{ foundRelated && <RelatedPosts { ...commonProps } /> }
				{ ! seoMovedToDashboard && ( foundSeo || foundCanonicalUrls ) && (
					<SEO
						{ ...commonProps }
						configureUrl={ getRedirectUrl( 'calypso-marketing-traffic', {
							site: this.props.blogID ?? this.props.siteRawUrl,
							anchor: 'seo',
						} ) }
					/>
				) }
				{ seoMovedToDashboard && foundMovedToDashboard && (
					<SimpleNotice status="is-info" showDismiss={ false } className="jp-seo-moved-banner">
						<div className="jp-seo-moved-banner__content">
							<strong>{ __( 'Jetpack SEO has its own dashboard', 'jetpack' ) }</strong>
							<p>
								{ __(
									'Manage your search engine optimization settings from the redesigned SEO dashboard.',
									'jetpack'
								) }
							</p>
							<Button
								primary
								rna
								compact
								href={ `${ this.props.siteAdminUrl }admin.php?page=jetpack-seo` }
							>
								{ __( 'Open the SEO dashboard', 'jetpack' ) }
							</Button>
						</div>
					</SimpleNotice>
				) }
				{ foundStats && <SiteStats { ...commonProps } /> }
				{ foundAnalytics && (
					<GoogleAnalytics { ...commonProps } site={ this.props.blogID ?? this.props.siteRawUrl } />
				) }
				{ foundBlaze && <Blaze { ...commonProps } /> }
				{ foundShortlinks && <Shortlinks { ...commonProps } /> }
				{ ! seoMovedToDashboard && foundSitemaps && <Sitemaps { ...commonProps } /> }
				{ ! seoMovedToDashboard && foundVerification && (
					<VerificationServices { ...commonProps } />
				) }
			</div>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		settings: getSettings( state ),
		isBlockThemeActive: currentThemeIsBlockTheme( state ),
		isOfflineMode: isOfflineMode( state ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		isSiteConnected: isSiteConnected( state ),
		lastPostUrl: getLastPostUrl( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
		hasConnectedOwner: hasConnectedOwner( state ),
		blogID: getSiteId( state ),
		siteUsesWpAdminInterface: siteUsesWpAdminInterface( state ),
	};
} )( Traffic );
