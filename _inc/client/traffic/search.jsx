/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { FEATURE_SEARCH_JETPACK } from 'lib/plans/constants';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getSiteAdminUrl } from 'state/initial-state';
import { getSitePlan } from 'state/site';
import { isFetchingSiteData } from 'state/site';
import { FormFieldset } from 'components/forms';
import { getPlanClass } from 'lib/plans/constants';

class Search extends React.Component {
	render() {
		const plan_is_business = ( 'is-business-plan' === getPlanClass( this.props.sitePlan.product_slug ) );
		const module_enabled = this.props.getOptionValue( 'search' );
		return (
			<SettingsCard
				{ ...this.props }
				module="search"
				feature={ FEATURE_SEARCH_JETPACK }
				hideButton
			>
				<SettingsGroup
					hasChild
					module={ { module: 'search' } }
					support={ {
						text: __( 'Jetpack Search supports many customizations.' ),
						link: 'https://jetpack.com/support/search',
					} }>
					<p>{ __( 'The built-in WordPress search is great for sites without much content. But as your site grows, searches slow down and return less relevant results.' ) } </p>
					<p>{ __( 'Jetpack Search replaces the built-in search with a fast, scalable, customizable, and highly-relevant search hosted in the WordPress.com cloud. The result: Your users find the content they want, faster.' ) } </p>
					{ plan_is_business && (
						<ModuleToggle
							slug="search"
							compact
							activated={ module_enabled }
							toggling={ this.props.isSavingAnyOption( 'search' ) }
							toggleModule={ this.props.toggleModuleNow }>
							{ __( 'Replace WordPress built-in search with Jetpack Search, an advanced search experience' ) }
						</ModuleToggle>
					) }
					{ plan_is_business && module_enabled && (
						<FormFieldset>
							<p className="jp-form-setting-explanation">
								{ __( 'Add the Jetpack Search widget to your sidebar to configure sorting and filters.' ) }
							</p>
						</FormFieldset>
					) }
				</SettingsGroup>
				{ plan_is_business && module_enabled && (
					<Card compact className="jp-settings-card__configure-link" href="customize.php?autofocus[panel]=widgets">{ __( 'Add Jetpack Search Widget' ) }</Card>
				) }
			</SettingsCard>
		);
	}
}

export default connect(
	state => {
		return {
			siteAdminUrl: getSiteAdminUrl( state ),
			sitePlan: getSitePlan( state ),
			fetchingSiteData: isFetchingSiteData( state ),
		};
	}
)( moduleSettingsForm( Search ) );

