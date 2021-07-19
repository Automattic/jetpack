/**
 * External dependencies
 */
import React, { Fragment, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { sprintf, __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import CompactFormToggle from 'components/form/form-toggle/compact';
import { ModuleToggle } from 'components/module-toggle';
import SettingsGroup from 'components/settings-group';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import Button from 'components/button';
import { getPlanClass } from 'lib/plans/constants';
import InstantSearchUpsellNudge from './instant-search-upsell-nudge';
import './module-control.scss';

/**
 * State dependencies
 */
import { isOfflineMode } from 'state/connection';
import { getUpgradeUrl, getSiteAdminUrl, arePromotionsActive } from 'state/initial-state';
import {
	getSitePlan,
	hasActiveSearchPurchase as selectHasActiveSearchPurchase,
	isFetchingSitePurchases,
} from 'state/site';
import { hasUpdatedSetting, isSettingActivated, isUpdatingSetting } from 'state/settings';
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
// NOTE: remove a8ctest after all relative PRs merged.
const RETURN_PATH = 'admin.php?page=jetpack-search&a8ctest';
const SEARCH_CUSTOMIZE_URL = 'customize.php?autofocus[section]=jetpack_search&return=%s';
const WIDGETS_EDITOR_URL = 'customize.php?autofocus[panel]=widgets&return=%s';

/**
 * Search settings component to be used within the Performance section.
 *
 * @param  {object} props - Component properties.
 * @returns {React.Component}	Search settings component.
 */
function Search( props ) {
	const {
		failedToEnableSearch,
		hasActiveSearchPurchase,
		updateOptions,
		siteAdminUrl,
		isInstantSearchPromotionActive,
	} = props;
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
	// Site has Legacy Search included in Business plan but doesn't have Jetpack Search subscription.
	const hasOnlyLegacySearch = props.isBusinessPlan && ! props.hasActiveSearchPurchase;

	const isInstantSearchCustomizeButtonDisabled =
		isSavingEitherOption ||
		! isModuleEnabled ||
		! isInstantSearchEnabled ||
		! hasActiveSearchPurchase;
	const isWidgetsEditorButtonDisabled = isSavingEitherOption || ! isModuleEnabled;
	const returnUrl = encodeURIComponent( siteAdminUrl + RETURN_PATH );
	const renderInstantSearchButtons = () => {
		return (
			<div className="jp-form-search-settings-group__buttons">
				<Button
					className="jp-form-search-settings-group__button is-customize-search"
					href={
						! isInstantSearchCustomizeButtonDisabled && sprintf( SEARCH_CUSTOMIZE_URL, returnUrl )
					}
					disabled={ isInstantSearchCustomizeButtonDisabled }
				>
					{ __( 'Customize search results', 'jetpack' ) }
				</Button>
				<Button
					className="jp-form-search-settings-group__button is-widgets-editor"
					href={ ! isWidgetsEditorButtonDisabled && sprintf( WIDGETS_EDITOR_URL, returnUrl ) }
					disabled={ isWidgetsEditorButtonDisabled }
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
					link: getRedirectUrl( 'jetpack-support-search' ) + 'asdf',
				} }
				className={ [ 'jp-form-search-settings-group' ] }
			>
				<p>{ props.inOfflineMode && __( 'Unavailable in Offline Mode', 'jetpack' ) }</p>

				{ props.isLoading && __( 'Loading…', 'jetpack' ) }

				{ ! props.isLoading && ( props.isBusinessPlan || props.hasActiveSearchPurchase ) && (
					<Fragment>
						<div className="jp-form-search-settings-group__toggle is-search">
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
							<div className="jp-form-search-settings-group__toggle-description">
								<p className="jp-form-search-settings-group__toggle-explanation">
									{ SEARCH_DESCRIPTION }
								</p>
							</div>
						</div>
						<div className="jp-form-search-settings-group__toggle is-instant-search">
							<CompactFormToggle
								checked={ isModuleEnabled && isInstantSearchEnabled }
								disabled={ isSavingEitherOption || ! props.hasActiveSearchPurchase }
								onChange={ toggleInstantSearch }
								toggling={ togglingInstantSearch }
							>
								{ __( 'Enable instant search experience (recommended)', 'jetpack' ) }
							</CompactFormToggle>
							<div className="jp-form-search-settings-group__toggle-description">
								{ ! hasOnlyLegacySearch && (
									<Fragment>
										<p className="jp-form-search-settings-group__toggle-explanation">
											{ INSTANT_SEARCH_DESCRIPTION }
										</p>
										{ renderInstantSearchButtons() }
									</Fragment>
								) }
								{ hasOnlyLegacySearch && isInstantSearchPromotionActive && (
									<InstantSearchUpsellNudge href={ props.upgradeUrl } />
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
		siteAdminUrl: getSiteAdminUrl( state ),
		isInstantSearchPromotionActive: arePromotionsActive( state ),
	};
} )( withModuleSettingsFormHelpers( Search ) );
