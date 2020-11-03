/**
 * External dependencies
 */
import React, { Fragment, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import FormToggle from 'components/form/form-toggle';
import { FEATURE_SEARCH_JETPACK, getPlanClass } from 'lib/plans/constants';
import { FormFieldset } from 'components/forms';
import getRedirectUrl from 'lib/jp-redirect';
import { isOfflineMode } from 'state/connection';
import {
	getSitePlan,
	hasActiveSearchPurchase as selectHasActiveSearchPurchase,
	isFetchingSitePurchases,
} from 'state/site';
import { hasUpdatedSetting, isSettingActivated, isUpdatingSetting } from 'state/settings';
import { ModuleToggle } from 'components/module-toggle';
import { SEARCH_DESCRIPTION, SEARCH_CUSTOMIZE_CTA, SEARCH_SUPPORT } from 'plans/constants';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';

function toggleModuleFactory( {
	getOptionValue,
	hasActiveSearchPurchase,
	toggleModuleNow,
	updateOptions,
} ) {
	return module => {
		toggleModuleNow( module );
		if ( hasActiveSearchPurchase && getOptionValue( 'search' ) ) {
			updateOptions( { instant_search_enabled: true } );
		}
	};
}

function toggleInstantSearchFactory( { hasActiveSearchPurchase, getOptionValue, updateOptions } ) {
	return () => {
		if ( hasActiveSearchPurchase && getOptionValue( 'search' ) ) {
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
		props.hasActiveSearchPurchase,
	] );
	const toggleInstantSearch = useMemo( () => toggleInstantSearchFactory( props ), [
		props.hasActiveSearchPurchase,
	] );

	useEffect( () => {
		if ( props.failedToEnableSearch && props.hasActiveSearchPurchase ) {
			props.updateOptions( { has_jetpack_search_product: true } );
			toggleModule( 'search' );
		}
	}, [ props.failedToEnableSearch, props.hasActiveSearchPurchase, toggleModule ] );

	return (
		<SettingsCard { ...props } module="search" feature={ FEATURE_SEARCH_JETPACK } hideButton>
			<SettingsGroup
				disableInOfflineMode
				hasChild
				module={ { module: 'search' } }
				support={ {
					text: SEARCH_SUPPORT,
					link: getRedirectUrl( 'jetpack-support-search' ),
				} }
			>
				<p>
					{ props.inOfflineMode
						? __( 'Unavailable in Offline Mode', 'jetpack' )
						: SEARCH_DESCRIPTION }
				</p>
				{ props.isLoading && __( 'Loading…', 'jetpack' ) }
				{ ! props.isLoading && ( props.isBusinessPlan || props.hasActiveSearchPurchase ) && (
					<Fragment>
						<ModuleToggle
							activated={ isModuleEnabled }
							compact
							slug="search"
							toggleModule={ toggleModule }
							toggling={ props.isSavingAnyOption( 'search' ) }
						>
							{ __( 'Enable Search', 'jetpack' ) }
						</ModuleToggle>

						<FormFieldset>
							<FormToggle
								checked={ isInstantSearchEnabled }
								disabled={ ! props.hasActiveSearchPurchase || ! isModuleEnabled }
								onChange={ toggleInstantSearch }
								toggling={ props.isSavingAnyOption( 'instant_search_enabled' ) }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable instant search experience (recommended)', 'jetpack' ) }
								</span>
							</FormToggle>
							<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
								{ __(
									'Instant search will allow your visitors to get search results as soon as they start typing. If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.',
									'jetpack'
								) }
							</p>
						</FormFieldset>
					</Fragment>
				) }
			</SettingsGroup>
			{ ! props.isLoading &&
				( props.isBusinessPlan || props.hasActiveSearchPurchase ) &&
				isModuleEnabled &&
				! isInstantSearchEnabled && (
					<Card
						compact
						className="jp-settings-card__configure-link"
						href="customize.php?autofocus[panel]=widgets"
					>
						{ __( 'Add Jetpack Search Widget', 'jetpack' ) }
					</Card>
				) }
			{ props.hasActiveSearchPurchase && isModuleEnabled && isInstantSearchEnabled && (
				<Card
					className="jp-settings-card__configure-link"
					compact
					href="customize.php?autofocus[section]=jetpack_search"
				>
					{ SEARCH_CUSTOMIZE_CTA }
				</Card>
			) }
		</SettingsCard>
	);
}

export default connect( state => {
	const planClass = getPlanClass( getSitePlan( state ).product_slug );
	return {
		isLoading: isFetchingSitePurchases( state ),
		inOfflineMode: isOfflineMode( state ),
		hasActiveSearchPurchase: selectHasActiveSearchPurchase( state ),
		isBusinessPlan: 'is-business-plan' === planClass,
		failedToEnableSearch:
			! isSettingActivated( state, 'search' ) &&
			! isUpdatingSetting( state, 'search' ) &&
			false === hasUpdatedSetting( state, 'search' ),
	};
} )( withModuleSettingsFormHelpers( Search ) );
