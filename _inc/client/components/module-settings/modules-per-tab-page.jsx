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
	LikesSettings,
	MonitorSettings,
	VideoPressSettings,
	WordAdsSettings
} from 'components/module-settings/';
import ExternalLink from 'components/external-link';
import {
	getSiteAdminUrl,
	getSiteRawUrl
} from 'state/initial-state';

class AllModuleSettingsComponent extends React.Component {
    render() {
		let { module } = this.props;
		switch ( module.module ) {
			case 'videopress':
				return ( <VideoPressSettings module={ module } /> );
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
			case 'likes':
				return ( <LikesSettings module={ module }  /> );
			case 'wordads':
				return ( <WordAdsSettings module={ module } /> );
			case 'google-analytics':
				if ( 'inactive' === module.configure_url ) {
					return (
						<div>
							{ __(
								'Google Analytics is a free service that complements our {{a}}built-in stats{{/a}} with different insights into your traffic.' +
								' WordPress.com stats and Google Analytics use different methods to identify and track activity on your site, so they will ' +
								'normally show slightly different totals for your visits, views, etc.',
								{
									components: {
										a: <a href={ 'https://wordpress.com/stats/day/' + this.props.siteRawUrl } />
									}
								}
							) }
						</div>
					);
				} else {
					return (
						<div>
							<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href={ module.configure_url }>{ __( 'Configure Google Analytics settings.' ) }</ExternalLink>
						</div>
					);
				}
			case 'gravatar-hovercards':
			case 'contact-form':
			case 'latex':
			case 'shortlinks':
			case 'shortcodes':
			case 'widget-visibility':
			case 'masterbar':
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
}

export const AllModuleSettings = connect(
	( state ) => {
		return {
			adminUrl: getSiteAdminUrl( state ),
			siteRawUrl: getSiteRawUrl( state )
		};
	}
)( AllModuleSettingsComponent );
