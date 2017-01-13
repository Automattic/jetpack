/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	StatsSettings,
	RelatedPostsSettings,
	CommentsSettings,
	LikesSettings,
	SubscriptionsSettings,
	ProtectSettings,
	MonitorSettings,
	SingleSignOnSettings,
	MinilevenSettings,
	CarouselSettings,
	InfiniteScrollSettings,
	TiledGallerySettings,
	PostByEmailSettings,
	CustomContentTypesSettings,
	AfterTheDeadlineSettings,
	MarkdownSettings,
	VerificationToolsSettings,
	SitemapsSettings,
	VideoPressSettings,
	WordAdsSettings
} from 'components/module-settings/';
import ExternalLink from 'components/external-link';

import {
	getSiteAdminUrl,
	getSiteRawUrl
} from 'state/initial-state';

const AllModuleSettingsComponent = React.createClass( {
	render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'videopress':
				return ( <VideoPressSettings module={ module } /> );
			case 'omnisearch':
				return (
					<div>
						<span className="jp-form-setting-explanation">{ this.props.module.long_description }</span>
						<br/>
						<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href='/wp-admin/admin.php?page=omnisearch'>{ __( 'Search your content.' ) }</ExternalLink>
					</div>
				);
			case 'post-by-email':
				return ( <PostByEmailSettings module={ module }  /> );
			case 'custom-content-types':
				return ( <CustomContentTypesSettings module={ module }  /> );
			case 'after-the-deadline':
				return ( <AfterTheDeadlineSettings module={ module }  /> );
			case 'markdown':
				return ( <MarkdownSettings module={ module }  /> );
			case 'tiled-gallery':
				return ( <TiledGallerySettings module={ module }  /> );
			case 'minileven':
				return ( <MinilevenSettings module={ module }  /> );
			case 'carousel':
				return ( <CarouselSettings module={ module }  /> );
			case 'infinite-scroll':
				return ( <InfiniteScrollSettings module={ module }  /> );
			case 'protect':
				return ( <ProtectSettings module={ module }  /> );
			case 'monitor':
				module.raw_url = this.props.siteRawUrl;
				return ( <MonitorSettings module={ module }  /> );
			case 'scan':
				return '' === module.configure_url ? (
					<div>
						{
							__( 'Upgrade Jetpack and our state-of-the-art security scanner will hunt out malicious files and report them immediately so that you\'re never unaware of what is happening on your website.' )
						}
					</div>
				) : (
					<div>
						<div className="jp-form-setting-explanation">
							{ __( 'You can see the information about security scanning in the "At a Glance" section.' ) }
						</div>
						<br />
						<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ module.configure_url }>{ __( 'Configure your Security Scans' ) }</ExternalLink>
					</div>
				);
			case 'sso':
				return ( <SingleSignOnSettings module={ module }  /> );
			case 'seo-tools':
				if ( '' === module.configure_url ) {
					return (
						<div>
							{ __( 'Make sure your site is easily found on search engines with SEO tools for your content and social posts.' ) }
						</div>
					);
				} else if ( 'checking' === module.configure_url ) {
					return null;
				} else if ( 'inactive' === module.configure_url ) {
					return (
						<div>
							{ __( 'Activate this module to use the advanced SEO tools.' ) }
						</div>
					);
				} else {
					return (
						<div>
							<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ module.configure_url }>{ __( 'Configure your SEO settings.' ) }</ExternalLink>
						</div>
					);
				}
			case 'stats':
				return ( <StatsSettings module={ module }  /> );
			case 'related-posts':
				return ( <RelatedPostsSettings module={ module } lastPostUrl={ this.props.lastPostUrl } /> );
			case 'comments':
				return ( <CommentsSettings module={ module }  /> );
			case 'subscriptions':
				return ( <SubscriptionsSettings module={ module } { ...this.props } /> );
			case 'likes':
				return ( <LikesSettings module={ module }  /> );
			case 'verification-tools':
				return ( <VerificationToolsSettings module={ module }  /> );
			case 'sitemaps':
				return ( <SitemapsSettings module={ module } { ...this.props } /> );
			case 'wordads':
				return ( <WordAdsSettings module={ module } /> );
			case 'gravatar-hovercards':
			case 'contact-form':
			case 'latex':
			case 'shortlinks':
			case 'shortcodes':
			case 'photon':
			case 'widget-visibility':
			case 'notifications':
			case 'enhanced-distribution':
				return <span className="jp-form-setting-explanation">{ __( 'This module has no configuration options' ) } </span>;
			case 'akismet':
			case 'backups':
				return '' === module.configure_url ? (
					<div>
						{
							module.module === 'akismet' ?
								__( 'Let search engines and visitors know that you are serious about your websites integrity by upgrading Jetpack. Our anti-spam tools will eliminate comment spam, protect your SEO, and make it easier for visitors to stay in touch.' )
								:
								__( 'Real-time offsite backups with automated restores deliver peace-of-mind, so you can focus on writing great content and increasing traffic while we protect every aspect of your investment. Upgrade today.' )
						}
					</div>
				) : (
					<div>
						{

							__( '{{link}}Configure your %(module_slug)s Settings {{/link}}', {
								components: {
									link: <ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ module.configure_url } />,
								},
								args: {
									module_slug: module.module === 'akismet' ? 'Akismet' : 'Backups'
								}
							} )
						}
					</div>
				);
			case 'custom-css':
			case 'widgets':
			case 'publicize':
			case 'sharedaddy':
			default:
				if ( 'publicize' === module.module ) {
					module.configure_url = this.props.adminUrl + 'options-general.php?page=sharing';
				}
				return (
					<div>
						{
							__( '{{link}}Configure your %(module_slug)s Settings {{/link}}', {
								components: {
									link: <ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ module.configure_url } />,
								},
								args: {
									module_slug: module.name
								}
							} )
						}
					</div>
				);
		}
	}
} );

export const AllModuleSettings = connect(
	( state ) => {
		return {
			adminUrl: getSiteAdminUrl( state ),
			siteRawUrl: getSiteRawUrl( state )
		};
	}
)( AllModuleSettingsComponent );
