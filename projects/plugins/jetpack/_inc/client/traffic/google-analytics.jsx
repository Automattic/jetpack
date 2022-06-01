import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
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
								'Google Analytics is a free service that complements our <a>built-in stats</a> with different insights into your traffic. WordPress.com stats and Google Analytics use different methods to identify and track activity on your site, so they will normally show slightly different totals for your visits, views, etc.',
								'jetpack'
							),
							{
								a: (
									<a
										href={ getRedirectUrl( 'calypso-stats-day', {
											site: this.props.siteRawUrl,
										} ) }
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
							href={ this.props.configureUrl }
						>
							{ __( 'Configure your Google Analytics settings', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
