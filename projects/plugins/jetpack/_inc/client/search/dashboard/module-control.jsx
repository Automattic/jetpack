/**
 * External dependencies
 */
import React, { Fragment, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { ModuleToggle } from 'components/module-toggle';
import SettingsGroup from 'components/settings-group';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import getRedirectUrl from 'lib/jp-redirect';
import { getPlanClass } from 'lib/plans/constants';

/**
 * State dependencies
 */
import { isOfflineMode } from 'state/connection';

import {
	getSitePlan,
	hasActiveSearchPurchase as selectHasActiveSearchPurchase,
	isFetchingSitePurchases,
} from 'state/site';
import { hasUpdatedSetting, isSettingActivated, isUpdatingSetting } from 'state/settings';

const SEARCH_DESCRIPTION = __(
	'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.',
	'jetpack'
);
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
		<Fragment>
			<QuerySite />
			<SettingsGroup
				disableInOfflineMode
				hasChild
				module={ { module: 'search' } }
				support={ {
					text: SEARCH_SUPPORT,
					link: getRedirectUrl( 'jetpack-support-search' ),
				} }
			>
				<p>{ props.inOfflineMode && __( 'Unavailable in Offline Mode', 'jetpack' ) }</p>

				{ props.isLoading && __( 'Loading…', 'jetpack' ) }

				{ ! props.isLoading && ( props.isBusinessPlan || props.hasActiveSearchPurchase ) && (
					<Fragment>
						<div className="jp-form-setting-search-toggle jp-form-search-module-toggle">
							<ModuleToggle
								activated={ isModuleEnabled }
								compact
								disabled={ isSavingEitherOption }
								slug="search"
								toggleModule={ toggleSearchModule }
								toggling={ togglingModule }
							>
								{ __( 'Enable Jetpack Search', 'jetpack' ) }
							</ModuleToggle>
							<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
								{ SEARCH_DESCRIPTION }
							</p>
						</div>
						<div className="jp-form-setting-search-toggle jp-form-instant-search-toggle">
							<CompactFormToggle
								checked={ isModuleEnabled && isInstantSearchEnabled }
								disabled={ isSavingEitherOption || ! props.hasActiveSearchPurchase }
								onChange={ toggleInstantSearch }
								toggling={ togglingInstantSearch }
							>
								{ __( 'Enable instant search experience (recommended)', 'jetpack' ) }
							</CompactFormToggle>
							<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
								{ __(
									'Allow your visitors to get search results as soon as they start typing.',
									'jetpack'
								) }
							</p>
						</div>
					</Fragment>
				) }
			</SettingsGroup>
		</Fragment>
	);
}

export default connect( state => {
	const planClass = getPlanClass( getSitePlan( state ).product_slug );
	return {
		hasActiveSearchPurchase: selectHasActiveSearchPurchase( state ),
		inOfflineMode: isOfflineMode( state ),
		isBusinessPlan: 'is-business-plan' === planClass,
		isLoading: isFetchingSitePurchases( state ),
		failedToEnableSearch:
			! isSettingActivated( state, 'search' ) &&
			! isUpdatingSetting( state, 'search' ) &&
			false === hasUpdatedSetting( state, 'search' ),
	};
} )( withModuleSettingsFormHelpers( Search ) );
