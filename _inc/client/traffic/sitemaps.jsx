/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import ExternalLink from 'components/external-link';
import get from 'lodash/get';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import {
	FormFieldset
} from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getSiteAdminUrl, isSiteVisibleToSearchEngines } from 'state/initial-state';

export class Sitemaps extends React.Component {
    trackSitemapUrl = () => {
		analytics.tracks.recordJetpackClick( 'sitemap-url-link' );
	};

	trackSitemapNewsUrl = () => {
		analytics.tracks.recordJetpackClick( 'sitemap-news-url-link' );
	};

	render() {
		const sitemaps = this.props.getModule( 'sitemaps' ),
			sitemap_url = get( sitemaps, [ 'extra', 'sitemap_url' ], '' ),
			news_sitemap_url = get( sitemaps, [ 'extra', 'news_sitemap_url' ], '' );

		return (
			<SettingsCard
				{ ...this.props }
				module="sitemaps"
				hideButton
			>
				<SettingsGroup module={ { module: 'sitemaps' } } hasChild support={ sitemaps.learn_more_button }>
					<ModuleToggle
						slug="sitemaps"
						compact
						activated={ this.props.getOptionValue( 'sitemaps' ) }
						toggling={ this.props.isSavingAnyOption( 'sitemaps' ) }
						toggleModule={ this.props.toggleModuleNow }>
						{ __( 'Generate XML sitemaps' ) }
					</ModuleToggle>
					{
						this.props.isSiteVisibleToSearchEngines
							? this.props.getOptionValue( 'sitemaps' ) && (
								<FormFieldset>
									<p className="jp-form-setting-explanation">{ __( 'Your sitemap is automatically sent to all major search engines for indexing.' ) }</p>
									<p>
										<ExternalLink onClick={ this.trackSitemapUrl } icon={ true } target="_blank" rel="noopener noreferrer" href={ sitemap_url }>{ sitemap_url }</ExternalLink>
										<br />
										<ExternalLink onClick={ this.trackSitemapNewsUrl } icon={ true } target="_blank" rel="noopener noreferrer" href={ news_sitemap_url }>{ news_sitemap_url }</ExternalLink>
									</p>
								</FormFieldset>
							)
							: (
								<FormFieldset>
										<p className="jp-form-setting-explanation">
											{
												__( 'Your site is not currently accessible to search engines. You might have "Search Engine Visibility" disabled in your {{a}}Reading Settings{{/a}}.', {
													components: {
														a: <a href={ this.props.siteAdminUrl + 'options-reading.php' } />
													}
												} )
											}
										</p>
								</FormFieldset>
							)
					}
				</SettingsGroup>
			</SettingsCard>
		);
	}
}

export default connect(
	state => {
		return {
			isSiteVisibleToSearchEngines: isSiteVisibleToSearchEngines( state ),
			siteAdminUrl: getSiteAdminUrl( state )
		};
	}
)( moduleSettingsForm( Sitemaps ) );
