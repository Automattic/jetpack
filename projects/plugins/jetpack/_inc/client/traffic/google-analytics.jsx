import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SimpleNotice from 'components/notice';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { FEATURE_GOOGLE_ANALYTICS_JETPACK } from 'lib/plans/constants';
import React, { Component } from 'react';

export const GoogleAnalytics = withModuleSettingsFormHelpers(
	class extends Component {
		trackConfigureClick() {
			analytics.tracks.recordJetpackClick( 'configure-ga' );
		}

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Google Analytics', 'Settings header', 'jetpack' ) }
					feature={ FEATURE_GOOGLE_ANALYTICS_JETPACK }
					hideButton
				>
					{ this.props.showDeprecationNotice && (
						<SimpleNotice status="is-warning" showDismiss={ false }>
							<div>
								{ __(
									"Jetpack's Google Analytics feature will be removed on August 6, 2024.",
									'jetpack'
								) }
							</div>
							<ExternalLink href={ getRedirectUrl( 'jetpack-support-google-analytics' ) }>
								{ __(
									'Read this document for details and how to keep tracking visits with Google Analytics',
									'jetpack'
								) }
							</ExternalLink>
						</SimpleNotice>
					) }
					<SettingsGroup
						disableInOfflineMode
						module={ { module: 'google-analytics' } }
						support={ {
							text: __(
								'Integrates your WordPress site with Google Analytics, a platform that offers insights into your traffic, visitors, and conversions.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-google-analytics' ),
						} }
					>
						{ createInterpolateElement(
							__(
								'Google Analytics is a free service that complements <a>Jetpack Stats</a> with different insights into your traffic. Jetpack Stats and Google Analytics use different methods to identify and track activity on your site, so they will normally show slightly different totals for your visits, views, etc.',
								'jetpack'
							),
							{
								a: (
									<a
										href={
											this.props.siteUsesWpAdminInterface
												? this.props.siteAdminUrl + 'admin.php?page=jetpack#/stats'
												: getRedirectUrl( 'calypso-stats-day', {
														site: this.props.siteRawUrl,
												  } )
										}
									/>
								),
							}
						) }
					</SettingsGroup>
					{ ! this.props.isUnavailableInOfflineMode( 'google-analytics' ) && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackConfigureClick }
							href={ getRedirectUrl(
								this.props.siteUsesWpAdminInterface
									? 'calypso-marketing-connections'
									: 'calypso-marketing-traffic',
								{
									site: this.props.site,
									anchor: 'analytics',
								}
							) }
							target="_blank"
						>
							{ __( 'Configure your Google Analytics settings', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
