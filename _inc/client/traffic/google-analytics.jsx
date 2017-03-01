/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { FEATURE_GOOGLE_ANALYTICS_JETPACK } from 'lib/plans/constants';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const GoogleAnalytics = moduleSettingsForm(
	React.createClass( {

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Analytics Settings', { context: 'Settings header' } ) }
					feature={ FEATURE_GOOGLE_ANALYTICS_JETPACK }
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'google-analytics' } } support="https://jetpack.com/support/google-analytics/">
						<p>
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
						</p>
					</SettingsGroup>
					{
						! this.props.isUnavailableInDevMode( 'google-analytics' ) && (
							<Card compact className="jp-settings-card__configure-link" href={ this.props.configureUrl }>{ __( 'Configure Google Analytics settings.' ) }</Card>
						)
					}
				</SettingsCard>
			);
		}
	} )
);
