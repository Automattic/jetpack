/**
 * External dependencies
 */
import React, { Fragment, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { FEATURE_SEARCH_JETPACK, getPlanClass } from 'lib/plans/constants';
import { FormFieldset } from 'components/forms';
import { isOfflineMode } from 'state/connection';
import {
	getSitePlan,
	hasActiveSearchPurchase as selectHasActiveSearchPurchase,
	isFetchingSitePurchases,
} from 'state/site';
import { hasUpdatedSetting, isSettingActivated, isUpdatingSetting } from 'state/settings';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';

const SEARCH_DESCRIPTION = __(
	'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.',
	'jetpack'
);
const SEARCH_CUSTOMIZE_CTA = __( 'Customize your Search experience.', 'jetpack' );
const SEARCH_SUPPORT = __( 'Search supports many customizations. ', 'jetpack' );

/**
 * Search settings component to be used within the Performance section.
 *
 * @param  {object} props - Component properties.
 * @returns {React.Component}	Search settings component.
 */
function Search( props ) {
	const { failedToEnableSearch, hasActiveSearchPurchase, updateOptions } = props;
	const isModuleEnabled = props.getOptionValue( 'search' );
	const isInstantSearchEnabled = props.getOptionValue( 'instant_search_enabled', 'search' );

	const toggleSearchModule = useCallback( () => {
		const newOption = { search: ! isModuleEnabled };
		if ( isInstantSearchEnabled !== ( hasActiveSearchPurchase && ! isModuleEnabled ) ) {
			newOption.instant_search_enabled = hasActiveSearchPurchase && ! isModuleEnabled;
		}
		updateOptions( newOption );
	}, [ hasActiveSearchPurchase, isInstantSearchEnabled, isModuleEnabled, updateOptions ] );

	const toggleInstantSearch = useCallback( () => {
		const newOption = {
			instant_search_enabled: hasActiveSearchPurchase && ! isInstantSearchEnabled,
		};
		if ( newOption.instant_search_enabled && ! isModuleEnabled ) {
			newOption.search = true;
		}
		updateOptions( newOption );
	}, [ hasActiveSearchPurchase, isInstantSearchEnabled, isModuleEnabled, updateOptions ] );

	useEffect( () => {
		if ( failedToEnableSearch && hasActiveSearchPurchase ) {
			updateOptions( { has_jetpack_search_product: true } );
			toggleSearchModule();
		}
	}, [ failedToEnableSearch, hasActiveSearchPurchase, updateOptions, toggleSearchModule ] );

	const togglingModule = !! props.isSavingAnyOption( 'search' );
	const togglingInstantSearch = !! props.isSavingAnyOption( 'instant_search_enabled' );
	const isSavingEitherOption = togglingModule || togglingInstantSearch;
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
							disabled={ isSavingEitherOption }
							slug="search"
							toggleModule={ toggleSearchModule }
							toggling={ togglingModule }
						>
							{ __( 'Enable Search', 'jetpack' ) }
						</ModuleToggle>

						<FormFieldset>
							<CompactFormToggle
								checked={ isModuleEnabled && isInstantSearchEnabled }
								disabled={ isSavingEitherOption || ! props.hasActiveSearchPurchase }
								onChange={ toggleInstantSearch }
								toggling={ togglingInstantSearch }
							>
								<span className="jp-form-toggle-explanation">
									{ __( 'Enable instant search experience (recommended)', 'jetpack' ) }
								</span>
							</CompactFormToggle>
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
					href="admin.php?page=jetpack-search-configure"
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
