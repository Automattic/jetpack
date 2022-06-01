import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import classNames from 'classnames';
import ClipboardButtonInput from 'components/clipboard-button-input';
import { FormFieldset } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { get } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { getSiteAdminUrl, isSiteVisibleToSearchEngines } from 'state/initial-state';

export class Sitemaps extends React.Component {
	renderSitemapRow = ( sitemap, sitemapTrack ) => {
		const trackSitemapUrl = () => analytics.tracks.recordJetpackClick( sitemapTrack );
		return (
			<span className="jp-sitemap-row">
				<ClipboardButtonInput
					value={ sitemap }
					copy={ _x( 'Copy', 'verb', 'jetpack' ) }
					copied={ __( 'Copied!', 'jetpack' ) }
					prompt={ __( 'Highlight and copy the following text to your clipboard:', 'jetpack' ) }
				/>
				<ExternalLink
					// eslint-disable-next-line react/jsx-no-bind
					onClick={ trackSitemapUrl }
					rel="noopener noreferrer"
					href={ sitemap }
				/>
			</span>
		);
	};

	render() {
		const sitemaps = this.props.getModule( 'sitemaps' ),
			sitemap_url = get( sitemaps, [ 'extra', 'sitemap_url' ], '' ),
			news_sitemap_url = get( sitemaps, [ 'extra', 'news_sitemap_url' ], '' );

		const searchEngineVisibilityClasses = classNames( {
			'jp-form-setting-explanation': true,
			'is-warning':
				! this.props.isSiteVisibleToSearchEngines && this.props.getOptionValue( 'sitemaps' ),
		} );

		return (
			<SettingsCard { ...this.props } module="sitemaps" hideButton>
				<SettingsGroup
					hasChild
					module={ { module: 'sitemaps' } }
					support={ {
						link: getRedirectUrl( 'jetpack-support-sitemaps' ),
					} }
				>
					<p>
						{ __(
							'Sitemaps are files that search engines like Google or Bing use to index your website. They can help improve your ranking in search results. When you enable this feature, Jetpack will create sitemaps for you and update them automatically when the content on your site changes.',
							'jetpack'
						) }
					</p>
					<ModuleToggle
						slug="sitemaps"
						compact
						activated={ this.props.getOptionValue( 'sitemaps' ) }
						toggling={ this.props.isSavingAnyOption( 'sitemaps' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						{ __( 'Generate XML sitemaps', 'jetpack' ) }
					</ModuleToggle>
					{ this.props.isSiteVisibleToSearchEngines ? (
						this.props.getOptionValue( 'sitemaps' ) && (
							<FormFieldset>
								<p className="jp-form-setting-explanation">
									{ __(
										'Good news: Jetpack is sending your sitemap automatically to all major search engines for indexing.',
										'jetpack'
									) }
									{ this.renderSitemapRow( sitemap_url, 'sitemap-url-link' ) }
									{ this.renderSitemapRow( news_sitemap_url, 'sitemap-news-url-link' ) }
								</p>
							</FormFieldset>
						)
					) : (
						<FormFieldset>
							<p className={ searchEngineVisibilityClasses }>
								{ createInterpolateElement(
									__(
										'Search engines can’t access your site at the moment. If you’d like to make your site accessible, check your <a>Reading settings</a> and switch "Search Engine Visibility" on.',
										'jetpack'
									),
									{
										a: <a href={ this.props.siteAdminUrl + 'options-reading.php' } />,
									}
								) }
							</p>
						</FormFieldset>
					) }
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		isSiteVisibleToSearchEngines: isSiteVisibleToSearchEngines( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
	};
} )( withModuleSettingsFormHelpers( Sitemaps ) );
