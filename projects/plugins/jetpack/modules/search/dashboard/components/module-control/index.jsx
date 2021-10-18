/**
 * External dependencies
 */
import React, { Fragment, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { sprintf, __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import QuerySite from '../data/query-site';
import CompactFormToggle from '../form/form-toggle/compact';
import { ModuleToggle } from '../module-toggle';
import SettingsGroup from '../settings-group';
import { withModuleSettingsFormHelpers } from '../module-settings/with-module-settings-form-helpers';
import Button from '../button';
import { getPlanClass } from 'lib/plans/constants';
import InstantSearchUpsellNudge from '../upsell-nudge';
import analytics from 'lib/analytics';
import 'scss/rna-styles.scss';
import './style.scss';

/**
 * State dependencies
 */
import { isOfflineMode } from 'state/connection';
import { getUpgradeUrl, getSiteAdminUrl, arePromotionsActive } from 'state/initial-state';
import {
	getSitePlan,
	hasActiveSearchPurchase as selectHasActiveSearchPurchase,
	isFetchingSitePurchases,
	getSiteID,
} from 'state/site';
import { hasUpdatedSetting, isSettingActivated, isUpdatingSetting } from 'state/settings';

const SEARCH_DESCRIPTION = __(
	'Jetpack Search is an incredibly powerful and customizable replacement for the search capability built into WordPress that helps your visitors find the right content.',
	'jetpack'
);
const INSTANT_SEARCH_DESCRIPTION = __(
	'Instant search will allow your visitors to get search results as soon as they start typing. If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.',
	'jetpack'
);
const RETURN_PATH = 'admin.php?page=jetpack-search';
const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
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
		if ( hasActiveSearchPurchase && isInstantSearchEnabled !== ! isModuleEnabled ) {
			newOption.instant_search_enabled = ! isModuleEnabled;
		}
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_module_toggle', newOption );
	}, [ hasActiveSearchPurchase, isModuleEnabled, updateOptions, isInstantSearchEnabled ] );

	const toggleInstantSearch = useCallback( () => {
		const newOption = {
			instant_search_enabled: hasActiveSearchPurchase && ! isInstantSearchEnabled,
		};
		if ( newOption.instant_search_enabled && ! isModuleEnabled ) {
			newOption.search = true;
		}
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_instant_toggle', newOption );
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
	const hasEitherSearch = props.isBusinessPlan || props.hasActiveSearchPurchase;

	const isInstantSearchCustomizeButtonDisabled =
		isSavingEitherOption ||
		! isModuleEnabled ||
		! isInstantSearchEnabled ||
		! hasActiveSearchPurchase;
	const isWidgetsEditorButtonDisabled = isSavingEitherOption || ! isModuleEnabled;
	const returnUrl = encodeURIComponent( siteAdminUrl + RETURN_PATH );

	const renderInstantSearchButtons = () => {
		return (
			<div className="jp-form-search-settings-group-buttons jp-search-dashboard-row">
				<div className="lg-col-span-3 md-col-span-2 sm-col-span-1"></div>
				<Button
					className="jp-form-search-settings-group-buttons__button is-customize-search lg-col-span-4 md-col-span-5 sm-col-span-3"
					href={
						! isInstantSearchCustomizeButtonDisabled && sprintf( SEARCH_CUSTOMIZE_URL, returnUrl )
					}
					disabled={ isInstantSearchCustomizeButtonDisabled }
				>
					<span>{ __( 'Customize search results', 'jetpack' ) }</span>
				</Button>
				<div className="lg-col-span-0 md-col-span-1 sm-col-span-0"></div>

				<div className="lg-col-span-0 md-col-span-2 sm-col-span-1"></div>
				<Button
					className="jp-form-search-settings-group-buttons__button is-widgets-editor lg-col-span-3 md-col-span-5 sm-col-span-3"
					href={ ! isWidgetsEditorButtonDisabled && sprintf( WIDGETS_EDITOR_URL, returnUrl ) }
					disabled={ isWidgetsEditorButtonDisabled }
				>
					<span>{ __( 'Edit sidebar widgets', 'jetpack' ) }</span>
				</Button>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		);
	};

	const renderSearchToggle = () => {
		return (
			<div className="jp-form-search-settings-group__toggle is-search jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
					{ /* <div className="jp-form-search-settings-group__toggle-container"> */ }
					<ModuleToggle
						activated={ isModuleEnabled && hasEitherSearch }
						compact
						disabled={
							isSavingEitherOption || ( ! props.hasActiveSearchPurchase && ! props.isBusinessPlan )
						}
						slug="search"
						toggleModule={ toggleSearchModule }
						toggling={ togglingModule }
						className="is-search-admin"
						switchClassNames="lg-col-span-1 md-col-span-1 sm-col-span-1"
						labelClassNames=" lg-col-span-7 md-col-span-5 sm-col-span-3"
						aria-label={ __( 'Enable Jetpack Search', 'jetpack' ) }
					>
						{ __( 'Enable Jetpack Search', 'jetpack' ) }
					</ModuleToggle>
					{ /* </div> */ }
					{ /* <div className="jp-form-search-settings-group__toggle_label lg-col-span-7 md-col-span-5 sm-col-span-3"> */ }
					{ /* { __( 'Enable Jetpack Search', 'jetpack' ) } */ }
					{ /* </div> */ }
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				</div>
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-3 md-col-span-2 sm-col-span-1"></div>
					<div className="jp-form-search-settings-group__toggle-description lg-col-span-7 md-col-span-5 sm-col-span-3">
						<p className="jp-form-search-settings-group__toggle-explanation">
							{ SEARCH_DESCRIPTION }
						</p>
					</div>
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				</div>
			</div>
		);
	};

	const renderInstantSearchToggle = () => {
		return (
			<div className="jp-form-search-settings-group__toggle is-instant-search jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
					{ /* <div className="jp-form-search-settings-group__toggle-container"> */ }
					<CompactFormToggle
						checked={ isModuleEnabled && isInstantSearchEnabled && props.hasActiveSearchPurchase }
						disabled={ isSavingEitherOption || ! props.hasActiveSearchPurchase }
						onChange={ toggleInstantSearch }
						toggling={ togglingInstantSearch }
						className="is-search-admin"
						switchClassNames="lg-col-span-1 md-col-span-1 sm-col-span-1"
						labelClassNames=" lg-col-span-7 md-col-span-5 sm-col-span-3"
						aria-label={ __( 'Enable instant search experience (recommended)', 'jetpack' ) }
					>
						{ createInterpolateElement(
							__( 'Enable instant search experience <span>(recommended)</span>', 'jetpack' ),
							{ span: <span /> }
						) }
					</CompactFormToggle>
					{ /* </div> */ }
					{ /* <div className="jp-form-search-settings-group__toggle_label">
						{ createInterpolateElement(
							__( 'Enable instant search experience <span>(recommended)</span>', 'jetpack' ),
							{ span: <span /> }
						) }
					</div> */ }
				</div>
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-3 md-col-span-2 sm-col-span-1"></div>
					<div className="jp-form-search-settings-group__toggle-description lg-col-span-7 md-col-span-5 sm-col-span-3">
						{ props.hasActiveSearchPurchase && (
							<Fragment>
								<p className="jp-form-search-settings-group__toggle-explanation">
									{ INSTANT_SEARCH_DESCRIPTION }
								</p>
							</Fragment>
						) }
						{ ! props.hasActiveSearchPurchase && isInstantSearchPromotionActive && (
							<InstantSearchUpsellNudge href={ props.upgradeUrl } upgrade={ hasOnlyLegacySearch } />
						) }
					</div>
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				</div>
				{ props.hasActiveSearchPurchase && renderInstantSearchButtons() }
			</div>
		);
	};

	const renderToggles = () => {
		return (
			<div className="jp-form-search-settings-group-inside">
				{ renderSearchToggle() }
				{ renderInstantSearchToggle() }
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
				className="jp-form-search-settings-group"
			>
				{ props.inOfflineMode && <p>__( 'Unavailable in Offline Mode', 'jetpack' )</p> }

				{ ! props.inOfflineMode && props.isLoading && <p>__( 'Loading…', 'jetpack' )</p> }

				{ ! props.inOfflineMode && ! props.isLoading && renderToggles() }
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
