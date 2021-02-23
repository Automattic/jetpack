/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const SEO = withModuleSettingsFormHelpers(
	class extends Component {
		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-seo' );
		};

		render() {
			const isActive = this.props.getOptionValue( 'seo-tools' );

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Search engine optimization', 'Settings header', 'jetpack' ) }
					feature={ 'seo-tools-jetpack' }
					module="seo-tools"
					hideButton
				>
					<SettingsGroup
						disableInOfflineMode
						module={ { module: 'seo-tools' } }
						support={ {
							text: __(
								'Allows you to optimize your site and its content for better results in search engines.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-seo-tools' ),
						} }
					>
						<p>
							{ __(
								'Take control of the way search engines represent your site. With Jetpack’s SEO tools you can preview how your content will look on popular search engines and change items like your site name and tagline in seconds.',
								'jetpack'
							) }
						</p>
						<ModuleToggle
							slug="seo-tools"
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'seo-tools' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Customize your SEO settings', 'jetpack' ) }
						</ModuleToggle>
					</SettingsGroup>
					{ isActive && ! this.props.isOfflineMode && (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackConfigureClick }
							href={ this.props.configureUrl }
						>
							{ __( 'Customize your SEO settings', 'jetpack' ) }
						</Card>
					) }
				</SettingsCard>
			);
		}
	}
);
