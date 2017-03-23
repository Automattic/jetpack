/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { FEATURE_SEO_TOOLS_JETPACK } from 'lib/plans/constants';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const SEO = moduleSettingsForm(
	React.createClass( {
		trackConfigureClick() {
			analytics.tracks.recordJetpackClick( 'configure-seo' );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Search engine optimization', { context: 'Settings header' } ) }
					feature={ FEATURE_SEO_TOOLS_JETPACK }
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'seo-tools' } } support="https://jetpack.com/support/seo-tools/">
						<span>
							{
								__( "You can tweak these settings if you'd like more advanced control. Read more about what you can do to {{a}}optimize your site's SEO{{/a}}.",
									{
										components: {
											a: <a href="https://jetpack.com/support/seo-tools/" />
										}
									}
								)
							}
						</span>
					</SettingsGroup>
					{
						! this.props.isUnavailableInDevMode( 'seo-tools' ) && (
							<Card compact className="jp-settings-card__configure-link" onClick={ this.trackConfigureClick } href={ this.props.configureUrl }>{ __( 'Configure your SEO settings' ) }</Card>
						)
					}
				</SettingsCard>
			);
		}
	} )
);
