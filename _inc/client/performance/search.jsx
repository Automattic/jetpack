/**
 * External dependencies
 */
import React, { Fragment, useMemo } from 'react';
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

function toggleModuleFactory( {
	// Destructure component props
	toggleModuleNow: toggleModule,
	sitePlan: { product_slug: productSlug },
	getOptionValue,
	updateOptions,
} ) {
	return module => {
		toggleModule( module );
		if ( 'is-search-plan' === getPlanClass( productSlug ) && getOptionValue( 'search' ) ) {
			updateOptions( { instant_search_enabled: true } );
		}
	};
}

function toggleInstantSearchFactory( {
	// Destructure component props
	sitePlan: { product_slug: productSlug },
	getOptionValue,
	updateOptions,
} ) {
	return () => {
		if ( 'is-search-plan' === getPlanClass( productSlug ) && getOptionValue( 'search' ) ) {
			updateOptions( {
				instant_search_enabled: ! getOptionValue( 'instant_search_enabled', 'search' ),
			} );
		}
	};
}

function Search( props ) {
	const isBusinessPlan = 'is-business-plan' === getPlanClass( props.sitePlan.product_slug );
	const isSearchPlan = 'is-search-plan' === getPlanClass( props.sitePlan.product_slug );
	const isModuleEnabled = props.getOptionValue( 'search' );
	const isInstantSearchEnabled = props.getOptionValue( 'instant_search_enabled', 'search' );

	const toggleModule = useMemo( () => toggleModuleFactory( props ), [
		props.toggleModuleNow,
		props.sitePlan.product_slug,
		props.getOptionValue,
		props.updateOptions,
	] );
	const toggleInstantSearch = useMemo( () => toggleInstantSearchFactory( props ), [
		props.sitePlan.product_slug,
		props.getOptionValue,
		props.updateOptions,
	] );

	return (
		<SettingsCard { ...props } module="search" feature={ FEATURE_SEARCH_JETPACK } hideButton>
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
					) }{ ' ' }
				</p>
				{ ( isBusinessPlan || isSearchPlan ) && (
					<Fragment>
						<ModuleToggle
							activated={ isModuleEnabled }
							compact
							slug="search"
							toggleModule={ toggleModule }
							toggling={ props.isSavingAnyOption( 'search' ) }
						>
							{ __( 'Enable Jetpack Search' ) }
						</ModuleToggle>
						<FormFieldset>
							<CompactFormToggle
								checked={ isInstantSearchEnabled }
								disabled={ ! isSearchPlan || ! isModuleEnabled }
								onChange={ toggleInstantSearch }
								toggling={ props.isSavingAnyOption( 'instant_search_enabled' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable instant search experience (recommended)' ) }
								</span>
							</CompactFormToggle>
							<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
								{ __(
									'Instant Search will allow your visitors to get search results as soon as they start typing. ' +
										'If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.'
								) }
							</p>
						</FormFieldset>
					</Fragment>
				) }
			</SettingsGroup>
			{ isSearchPlan && isModuleEnabled && isInstantSearchEnabled && (
				<Card
					className="jp-settings-card__configure-link"
					compact
					href="customize.php?autofocus[section]=jetpack_search"
				>
					{ __( 'Configure your Jetpack Search experience in the customizer' ) }
				</Card>
			) }
		</SettingsCard>
	);
}

export default connect( state => {
	return {
		siteAdminUrl: getSiteAdminUrl( state ),
		sitePlan: getSitePlan( state ),
		fetchingSiteData: isFetchingSiteData( state ),
	};
} )( withModuleSettingsFormHelpers( Search ) );
