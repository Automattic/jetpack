import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData, isWoASite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
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
import SeoOptInBanner from './seo-optin-banner';
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
		// dedicated SEO dashboard, so hide those legacy sections here. Existing
		// self-hosted installs that haven't opted in keep them (JETPACK-1682).
		const seoMovedToDashboard = getScriptData()?.seo?.surface_visible === true;
		// The opt-in notice covers every section that moves, so show it for any of those,
		// including a "sitemap" or "verification" search that misses the SEO section.
		const foundMovedToDashboard =
			foundSeo || foundCanonicalUrls || foundSitemaps || foundVerification;

		// Once moved, those sections render nothing here, so they no longer count as a match.
		const foundLegacySeoSections = ! seoMovedToDashboard && foundMovedToDashboard;

		if (
			! foundLegacySeoSections &&
			! foundStats &&
			! foundShortlinks &&
			! foundRelated &&
			! foundAnalytics &&
			! foundBlaze
		) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Traffic Settings', 'jetpack' ) }</h1>
				{ this.props.searchTerm && (
					<h2 className="jp-settings__section-title">{ __( 'Traffic', 'jetpack' ) }</h2>
				) }
				{ foundRelated && <RelatedPosts { ...commonProps } /> }
				{ foundMovedToDashboard && <SeoOptInBanner /> }
				{ ! seoMovedToDashboard && ( foundSeo || foundCanonicalUrls ) && (
					<SEO
						{ ...commonProps }
						configureUrl={ getRedirectUrl( 'calypso-marketing-traffic', {
							site: this.props.blogID ?? this.props.siteRawUrl,
							anchor: 'seo',
						} ) }
					/>
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
