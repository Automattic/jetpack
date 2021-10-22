/**
 * External dependencies
 */
import React, { Fragment, useCallback, useEffect } from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { select, useDispatch, useSelect } from '@wordpress/data';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import CompactFormToggle from '../form/form-toggle/compact';
import Card from 'components/card';
import Button from '../button';
import InstantSearchUpsellNudge from '../upsell-nudge';
import analytics from 'lib/analytics';
import 'scss/rna-styles.scss';
import './style.scss';

/**
 * State dependencies
 */
import { STORE_ID } from '../../store';

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
 * @returns {React.Component}	Search settings component.
 */
export default function SearchModuleControl() {
	// todo: change this
	const failedToEnableSearch = false;
	const inOfflineMode = false;
	const isLoading = false;
	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;

	const hasActiveSearchPurchase = useSelect(
		select => select( STORE_ID ).hasActiveSearchPurchase(),
		[]
	);
	const siteAdminUrl = select( STORE_ID ).getSiteAdminUrl();
	const isInstantSearchPromotionActive = select( STORE_ID ).isInstantSearchPromotionActive();
	const isBusinessPlan = select( STORE_ID ).hasBusinessPlan();
	const { isModuleEnabled, isInstantSearchEnabled } = useSelect(
		select => select( STORE_ID ).getSearchModuleStatus(),
		[]
	);

	const togglingModule = false; //TODO //!!props.isSavingAnyOption('search');
	const togglingInstantSearch = false; //TODO //!!props.isSavingAnyOption('instant_search_enabled');
	const isSavingEitherOption = togglingModule || togglingInstantSearch;
	// Site has Legacy Search included in Business plan but doesn't have Jetpack Search subscription.
	const hasOnlyLegacySearch = isBusinessPlan && ! hasActiveSearchPurchase;
	const hasEitherSearch = isBusinessPlan || hasActiveSearchPurchase;

	const isInstantSearchCustomizeButtonDisabled =
		isSavingEitherOption ||
		! isModuleEnabled ||
		! isInstantSearchEnabled ||
		! hasActiveSearchPurchase;
	const isWidgetsEditorButtonDisabled = isSavingEitherOption || ! isModuleEnabled;
	const returnUrl = encodeURIComponent( siteAdminUrl + RETURN_PATH );

	const toggleSearchModule = useCallback( () => {
		const newOption = { search: ! isModuleEnabled, instant_search_enabled: isInstantSearchEnabled };
		if ( hasActiveSearchPurchase && isInstantSearchEnabled !== ! isModuleEnabled ) {
			newOption.instant_search_enabled = ! isModuleEnabled;
		}
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_module_toggle', newOption );
	}, [ hasActiveSearchPurchase, isModuleEnabled, updateOptions, isInstantSearchEnabled ] );

	const toggleInstantSearch = useCallback( () => {
		const newOption = {
			instant_search_enabled: hasActiveSearchPurchase && ! isInstantSearchEnabled,
			search: isModuleEnabled,
		};
		// if (newOption.instant_search_enabled && !isModuleEnabled) {
		if ( newOption.instant_search_enabled ) {
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
					<CompactFormToggle
						checked={ isModuleEnabled && hasEitherSearch }
						disabled={ isSavingEitherOption || ( ! hasActiveSearchPurchase && ! isBusinessPlan ) }
						onChange={ toggleSearchModule }
						toggling={ togglingModule }
						className="is-search-admin"
						switchClassNames="lg-col-span-1 md-col-span-1 sm-col-span-1"
						labelClassNames=" lg-col-span-7 md-col-span-5 sm-col-span-3"
						aria-label={ __( 'Enable Jetpack Search', 'jetpack' ) }
					>
						{ __( 'Enable Jetpack Search', 'jetpack' ) }
					</CompactFormToggle>
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
						checked={ isModuleEnabled && isInstantSearchEnabled && hasActiveSearchPurchase }
						disabled={ isSavingEitherOption || ! hasActiveSearchPurchase }
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
						{ hasActiveSearchPurchase && (
							<Fragment>
								<p className="jp-form-search-settings-group__toggle-explanation">
									{ INSTANT_SEARCH_DESCRIPTION }
								</p>
							</Fragment>
						) }
						{ ! hasActiveSearchPurchase && isInstantSearchPromotionActive && (
							<InstantSearchUpsellNudge href={ upgradeUrl } upgrade={ hasOnlyLegacySearch } />
						) }
					</div>
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				</div>
				{ hasActiveSearchPurchase && renderInstantSearchButtons() }
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
			<div className="jp-form-settings-group jp-form-search-settings-group">
				<Card
					className={ classNames( {
						'jp-form-has-child': true,
						'jp-form-settings-disable': false, //disableInOfflineMode || disableInSiteConnectionMode,
					} ) }
				>
					{ inOfflineMode && <p>__( 'Unavailable in Offline Mode', 'jetpack' )</p> }

					{ ! inOfflineMode && isLoading && <p>__( 'Loading…', 'jetpack' )</p> }

					{ ! inOfflineMode && ! isLoading && renderToggles() }
				</Card>
			</div>
		</Fragment>
	);
}
