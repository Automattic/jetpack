/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';
import ExternalLink from 'components/external-link';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLegend,
	FormLabel
} from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const VerificationServices = moduleSettingsForm(
	React.createClass( {

		render() {
			let verification     = this.props.getModule( 'verification-tools' ),
				sitemaps         = this.props.getModule( 'sitemaps' ),
				sitemap_url      = get( sitemaps, [ 'extra', 'sitemap_url' ], '' ),
				news_sitemap_url = get( sitemaps, [ 'extra', 'news_sitemap_url' ], '' );
			return (
				<SettingsCard
					{ ...this.props }
					module="verification-tools">
					<SettingsGroup support={ verification.learn_more_button }>
						<p>
							{ __(
								'Note that {{b}}verifying your site with these services is not necessary{{/b}} in order for your site to be indexed by search engines. To use these advanced search engine tools and verify your site with a service, paste the HTML Tag code below. Read the {{support}}full instructions{{/support}} if you are having trouble. Supported verification services: {{google}}Google Search Console{{/google}}, {{bing}}Bing Webmaster Center{{/bing}}, {{pinterest}}Pinterest Site Verification{{/pinterest}}, and {{yandex}}Yandex.Webmaster{{/yandex}}.',
								{
									components: {
										b: <strong />,
										support: <a href="https://jetpack.com/support/site-verification-tools/" />,
										google: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://www.google.com/webmasters/tools/"
											/>
										),
										bing: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://www.bing.com/webmaster/"
											/>
										),
										pinterest: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://pinterest.com/website/verify/"
											/>
										),
										yandex: (
											<ExternalLink
												icon={ true }
												target="_blank"
												href="https://webmaster.yandex.com/sites/"
											/>
										)
									}
								}
							) }
						</p>
						<FormFieldset>
							{
								[
									{
										id: 'google',
										label: __( 'Google' ),
										placeholder: '<meta name="google-site-verification" content="1234" />'
									},
									{
										id: 'bing',
										label: __( 'Bing' ),
										placeholder: '<meta name="msvalidate.01" content="1234" />'
									},
									{
										id: 'pinterest',
										label: __( 'Pinterest' ),
										placeholder: '<meta name="p:domain_verify" content="1234" />'
									},
									{
										id: 'yandex',
										label: __( 'Yandex' ),
										placeholder: '<meta name="yandex-verification" content="1234" />'
									}
								].map( item => (
									<FormLabel
										className="jp-form-input-with-prefix"
										key={ `verification_service_${ item.id }` }>
										<span>{ item.label }</span>
										<TextInput
											name={ item.id }
											value={ this.props.getOptionValue( item.id ) }
											placeholder={ item.placeholder }
											className="code"
											disabled={ this.props.isUpdating( item.id ) }
											onChange={ this.props.onOptionChange} />
									</FormLabel>
								) )
							}
						</FormFieldset>
					</SettingsGroup>
					<SettingsGroup support={ sitemaps.learn_more_button }>
						<FormFieldset>
							<FormLegend>{ __( 'XML Sitemaps' ) }</FormLegend>
							<div>
								<p>{ __( 'Search engines will find the sitemaps at these locations:' ) }</p>
								<ul>
									{
										[
											{
												id: 'sitemap',
												label: __( 'Sitemaps' ),
												url: sitemap_url
											},
											{
												id: 'news_sitemap',
												label: __( 'News Sitemaps' ),
												url: news_sitemap_url
											}
										].map( item => (
											<li key={ `xml_${ item.id }` }>
												<strong>{ item.label }</strong>
												<br />
												<ExternalLink icon={ true } target="_blank" href={ item.url }>{ item.url }</ExternalLink>
											</li>
										) )
									}
								</ul>
							</div>
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
