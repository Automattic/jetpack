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
import Button from 'components/button';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import getRedirectUrl from 'lib/jp-redirect';
import { getPlanClass } from 'lib/plans/constants';
import './module-control.scss';
import { getUpgradeUrl } from 'state/initial-state';

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
import InstantSearchUpsellNudge from './instant-search-upsell-nudge';
import { getSiteID } from '../../state/site';

const SEARCH_DESCRIPTION = __(
	'Jetpack Search is an incredibly powerful and customizable replacement for the search capability built into WordPress that helps your visitors find the right content.',
	'jetpack'
);
const INSTANT_SEARCH_DESCRIPTION = __(
	'Instant search will allow your visitors to get search results as soon as they start typing. If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.',
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

	const isInstantSearchCFAButtonDisabled =
		isSavingEitherOption ||
		! isModuleEnabled ||
		! isInstantSearchEnabled ||
		! props.hasActiveSearchPurchase;

	const showInstantSearchUpsellNudge = props.isBusinessPlan && ! props.hasActiveSearchPurchase;

	const renderInstantSearchCFAButtons = () => {
		return (
			<div className="jp-form-setting-cfa-buttons">
				<Button
					className="jp-form-setting-cfa-button jp-form-setting-cfa-customize-button"
					href={
						! isInstantSearchCFAButtonDisabled && 'customize.php?autofocus[section]=jetpack_search'
					}
					disabled={ isInstantSearchCFAButtonDisabled }
				>
					{ __( 'Customize search results', 'jetpack' ) }
				</Button>
				<Button
					className="jp-form-setting-cfa-button jp-form-setting-cfa-edit-widgets-button"
					href={ ! isInstantSearchCFAButtonDisabled && 'customize.php?autofocus[panel]=widgets' }
					disabled={ isInstantSearchCFAButtonDisabled }
				>
					{ __( 'Edit sidebar widgets', 'jetpack' ) }
				</Button>
			</div>
		);
	};

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
				className={ [ 'jp-form-search-settings-group' ] }
			>
				<p>{ props.inOfflineMode && __( 'Unavailable in Offline Mode', 'jetpack' ) }</p>

				{ props.isLoading && __( 'Loading…', 'jetpack' ) }

				{ ! props.isLoading && ( props.isBusinessPlan || props.hasActiveSearchPurchase ) && (
					<Fragment>
						<div className="jp-search-search-toggle jp-search-search-toggle--search">
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
							<div className="jp-search-search-toggle__description">
								<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
									{ SEARCH_DESCRIPTION }
								</p>
							</div>
						</div>
						<div className="jp-search-search-toggle jp-search-search-toggle--instant-search">
							<CompactFormToggle
								checked={ isModuleEnabled && isInstantSearchEnabled }
								disabled={ isSavingEitherOption || ! props.hasActiveSearchPurchase }
								onChange={ toggleInstantSearch }
								toggling={ togglingInstantSearch }
							>
								{ __( 'Enable instant search experience (recommended)', 'jetpack' ) }
							</CompactFormToggle>
							<div className="jp-search-search-toggle__description">
								<p className="jp-form-setting-explanation jp-form-search-setting-explanation">
									{ INSTANT_SEARCH_DESCRIPTION }
								</p>
								{ showInstantSearchUpsellNudge ? (
									<InstantSearchUpsellNudge href={ props.upgradeUrl } />
								) : (
									renderInstantSearchCFAButtons()
								) }
							</div>
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
		siteID: getSiteID( state ),
		upgradeUrl: getUpgradeUrl( state, 'jetpack-search' ),
	};
} )( withModuleSettingsFormHelpers( Search ) );
