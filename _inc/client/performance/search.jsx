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
import { FEATURE_SEARCH_JETPACK, getPlanClass } from 'lib/plans/constants';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getSiteAdminUrl } from 'state/initial-state';
import { getSitePlan, isFetchingSiteData } from 'state/site';
import { FormFieldset } from 'components/forms';
import CompactFormToggle from 'components/form/form-toggle/compact';

class Search extends React.Component {
	toggleModule( module ) {
		const plan_is_search = 'is-search-plan' === getPlanClass( this.props.sitePlan.product_slug );

		this.props.toggleModuleNow( module );

		if ( plan_is_search && this.props.getOptionValue( 'search' ) ) {
			// When toggled on, always enable instant search
			this.props.updateOptions( {
				instant_search_enabled: true,
			} );
		}
	}

	toggleInstantEnabled() {
		const plan_is_search = 'is-search-plan' === getPlanClass( this.props.sitePlan.product_slug );
		if ( plan_is_search && this.props.getOptionValue( 'search' ) ) {
			this.props.updateOptions( {
				instant_search_enabled: ! this.props.getOptionValue( 'instant_search_enabled', 'search' ),
			} );
		}
	}

	render() {
		const plan_is_business =
			'is-business-plan' === getPlanClass( this.props.sitePlan.product_slug );
		const plan_is_search = 'is-search-plan' === getPlanClass( this.props.sitePlan.product_slug );
		const module_enabled = this.props.getOptionValue( 'search' );
		const instant_search_enabled = this.props.getOptionValue( 'instant_search_enabled', 'search' );
		return (
			<SettingsCard { ...this.props } module="search" feature={ FEATURE_SEARCH_JETPACK } hideButton>
				<SettingsGroup
					hasChild
					module={ { module: 'search' } }
					support={ {
						text: __( 'Jetpack Search supports many customizations.' ),
						link: 'https://jetpack.com/support/search',
					} }
				>
					<p>
						{ __(
							'Help visitors quickly find answers with highly relevant instant search results and powerful filtering hosted in the WordPress.com cloud.'
						) }{' '}
					</p>
					{ ( plan_is_business || plan_is_search ) && (
						<ModuleToggle
							slug="search"
							compact
							activated={ module_enabled }
							toggling={ this.props.isSavingAnyOption( 'search' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Enable Jetpack Search' ) }
						</ModuleToggle>
					) }
					{ ( plan_is_business || plan_is_search ) && (
						<FormFieldset>
							<CompactFormToggle
								checked={ instant_search_enabled }
								disabled={ ! plan_is_search || ! module_enabled }
								toggling={ this.props.isSavingAnyOption( 'search' ) }
								onChange={ this.toggleInstantEnabled }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable instant search experience (recommended)' ) }
								</span>
							</CompactFormToggle>
							<p>
								{ __(
									'Instant Search will allow your visitors to get search results as soon as they start typing. ' +
										'If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.'
								) }
							</p>
						</FormFieldset>
					) }
				</SettingsGroup>
				{ plan_is_search && module_enabled && instant_search_enabled && (
					<Card
						compact
						className="jp-settings-card__configure-link"
						href="customize.php?autofocus[section]=jetpack_search"
					>
						{ __( 'Configure your Jetpack Search experience in the customizer' ) }
					</Card>
				) }
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		siteAdminUrl: getSiteAdminUrl( state ),
		sitePlan: getSitePlan( state ),
		fetchingSiteData: isFetchingSiteData( state ),
	};
} )( withModuleSettingsFormHelpers( Search ) );
