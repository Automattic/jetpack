/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';
import { FEATURE_SEO_TOOLS_JETPACK, getPlanClass } from 'lib/plans/constants';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getSitePlan } from 'state/site';

class SeoComponent extends React.Component {
	trackConfigureClick = () => {
		analytics.tracks.recordJetpackClick( 'configure-seo' );
	};

	render() {
		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		return (
			<SettingsCard
				{ ...this.props }
				header={ _x( 'Search engine optimization', 'Settings header', 'jetpack' ) }
				feature={ FEATURE_SEO_TOOLS_JETPACK }
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
					<span>
						{ __(
							'Take control of the way search engines represent your site. With Jetpack’s SEO tools you can preview how your content will look on popular search engines and change items like your site name and tagline in seconds.',
							'jetpack'
						) }
					</span>
				</SettingsGroup>
				{ ! this.props.isUnavailableInOfflineMode( 'seo-tools' ) &&
					( 'is-business-plan' === planClass || 'is-premium-plan' === planClass ) && (
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

export const SEO = connect( state => {
	return {
		sitePlan: getSitePlan( state ),
	};
} )( withModuleSettingsFormHelpers( SeoComponent ) );
