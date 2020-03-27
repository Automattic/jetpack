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
import {
	getSitePlan,
	hasSearchProducPurchase as selectHasSearchPurchase,
	isFetchingSitePurchases,
} from 'state/site';
import { FormFieldset } from 'components/forms';
import CompactFormToggle from 'components/form/form-toggle/compact';

function toggleModuleFactory( {
	getOptionValue,
	hasSearchPurchase,
	toggleModuleNow,
	updateOptions,
} ) {
	return module => {
		toggleModuleNow( module );
		if ( hasSearchPurchase && getOptionValue( 'search' ) ) {
			updateOptions( { instant_search_enabled: true } );
		}
	};
}

function toggleInstantSearchFactory( { hasSearchPurchase, getOptionValue, updateOptions } ) {
	return () => {
		if ( hasSearchPurchase && getOptionValue( 'search' ) ) {
			updateOptions( {
				instant_search_enabled: ! getOptionValue( 'instant_search_enabled', 'search' ),
			} );
		}
	};
}

function Search( props ) {
	const isModuleEnabled = props.getOptionValue( 'search' );
	const isInstantSearchEnabled = props.getOptionValue( 'instant_search_enabled', 'search' );

	const toggleModule = useMemo( () => toggleModuleFactory( props ), [
		props.getOptionValue,
		props.hasSearchPurchase,
		props.toggleModuleNow,
		props.updateOptions,
	] );
	const toggleInstantSearch = useMemo( () => toggleInstantSearchFactory( props ), [
		props.getOptionValue,
		props.hasSearchPurchase,
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
						'Help visitors quickly find answers with highly relevant instant search results and powerful filtering. Powered by the WordPress.com cloud.'
					) }{ ' ' }
				</p>
				{ props.isLoading && __( 'Loading…' ) }
				{ ! props.isLoading && ( props.isBusinessPlan || props.hasSearchPurchase ) && (
					// TODO: There's a known bug preventing Jetpack Search from being enabled here for Search product purchases
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
								disabled={ ! props.hasSearchPurchase || ! isModuleEnabled }
								onChange={ toggleInstantSearch }
								toggling={ props.isSavingAnyOption( 'instant_search_enabled' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable instant search experience (recommended)' ) }
								</span>
							</CompactFormToggle>
							<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
								{ __(
									'Instant search will allow your visitors to get search results as soon as they start typing. ' +
										'If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.'
								) }
							</p>
						</FormFieldset>
					</Fragment>
				) }
			</SettingsGroup>
			{ ! props.isLoading &&
				( props.isBusinessPlan || props.hasSearchPurchase ) &&
				isModuleEnabled &&
				! isInstantSearchEnabled && (
					<Card
						compact
						className="jp-settings-card__configure-link"
						href="customize.php?autofocus[panel]=widgets"
					>
						{ __( 'Add Jetpack Search Widget' ) }
					</Card>
				) }
			{ props.hasSearchPurchase && isModuleEnabled && isInstantSearchEnabled && (
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
	const planClass = getPlanClass( getSitePlan( state ).product_slug );
	return {
		isLoading: isFetchingSitePurchases( state ),
		hasSearchPurchase: selectHasSearchPurchase( state ),
		isBusinessPlan: 'is-business-plan' === planClass,
	};
} )( withModuleSettingsFormHelpers( Search ) );
