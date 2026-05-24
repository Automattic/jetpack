import analytics from '@automattic/jetpack-analytics';
import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Button, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { Fragment, useCallback } from 'react';
import AIAgentAccessControl from 'components/ai-agent-access-control';
import Card from 'components/card';
import ReaderChatControl from 'components/reader-chat-control';
import SearchSuggestionsControl from 'components/search-suggestions-control';
import InstantSearchUpsellNudge from 'components/upsell-nudge';
import { STORE_ID } from 'store';

import 'scss/rna-styles.scss';
import './style.scss';

const SEARCH_DESCRIPTION = __(
	'Jetpack Search is an incredibly powerful and customizable replacement for the search capability built into WordPress that helps your visitors find the right content.',
	'jetpack-search-pkg'
);
const INSTANT_SEARCH_DESCRIPTION = __(
	'Instant search uses a dynamic overlay for lightning-fast searching, sorting, and filtering without reloading the page.',
	'jetpack-search-pkg'
);
const RETURN_PATH = 'admin.php?page=jetpack-search';
const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
const WIDGETS_EDITOR_URL = 'widgets.php';

/**
 * Search settings component to be used within the Performance section.
 *
 * @param {object}   props                                - Component properties.
 * @param {string}   props.domain                         - Calypso slug.
 * @param {string}   props.siteAdminUrl                   - site admin URL.
 * @param {Function} props.updateOptions                  - function to update settings.
 * @param {boolean}  props.isDisabledFromOverLimit        - true if the subscription is invalid to manipulate controls.
 * @param {boolean}  props.isSavingEitherOption           - true if Saving options.
 * @param {boolean}  props.isModuleEnabled                - true if Search module is enabled.
 * @param {boolean}  props.isInstantSearchEnabled         - true if Instant Search is enabled.
 * @param {boolean}  props.isInstantSearchPromotionActive - true if search promotion is active.
 * @param {boolean}  props.isReaderChatAvailable          - true if the Reader Chat setting is available.
 * @param {boolean}  props.isReaderChatEnabled            - true if Reader Chat is enabled.
 * @param {boolean}  props.isAIAgentAccessAvailable       - true if the AI Agent Access setting is available.
 * @param {boolean}  props.supportsOnlyClassicSearch      - true if site has plan that supports only Classic Search.
 * @param {boolean}  props.supportsSearch                 - true if site has plan that supports either Classic or Instant Search.
 * @param {boolean}  props.supportsInstantSearch          - true if site has plan that supports Instant Search.
 * @param {boolean}  props.isTogglingModule               - true if toggling Search module.
 * @param {boolean}  props.isTogglingInstantSearch        - true if toggling Instant Search option.
 * @param {string}   props.readerChatGuidelinesUrl        - Guidelines admin URL, when available.
 * @param {boolean}  props.isSearchSuggestionsEnabled     - true if search suggestions (autocomplete) is enabled.
 * @param {string}   props.aiAgentAccessGuidelinesUrl     - AI Agent Access guidelines admin URL, when available.
 * @return {import('react').Component} Search settings component.
 */
export default function SearchModuleControl( {
	siteAdminUrl,
	updateOptions,
	domain,
	isDisabledFromOverLimit,
	isSavingEitherOption,
	isModuleEnabled,
	isInstantSearchEnabled,
	isInstantSearchPromotionActive,
	isReaderChatAvailable,
	isReaderChatEnabled,
	isAIAgentAccessAvailable,
	supportsOnlyClassicSearch,
	supportsSearch,
	supportsInstantSearch,
	isTogglingModule,
	isTogglingInstantSearch,
	readerChatGuidelinesUrl,
	isSearchSuggestionsEnabled,
	aiAgentAccessGuidelinesUrl,
} ) {
	const { isUserConnected } = useConnection( {
		redirectUri: 'admin.php?page=jetpack-search',
		from: 'jetpack-search',
	} );
	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );
	const upgradeUrl = getProductCheckoutUrl(
		'jetpack_search_free',
		domain,
		`admin.php?page=jetpack-search`,
		isUserConnected || isWpcom
	);
	const showAIAgentAccessGuidelinesLink =
		! isReaderChatAvailable ||
		! supportsSearch ||
		! isReaderChatEnabled ||
		readerChatGuidelinesUrl !== aiAgentAccessGuidelinesUrl;
	const isReaderChatControlAvailable = isReaderChatAvailable && supportsSearch;

	const toggleSearchModule = useCallback( () => {
		if ( isDisabledFromOverLimit ) {
			return;
		}

		const newOption = {
			module_active: ! isModuleEnabled,
		};
		if ( isInstantSearchEnabled !== ! isModuleEnabled ) {
			newOption.instant_search_enabled = ! isModuleEnabled && supportsInstantSearch;
		}
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_module_toggle', newOption );
	}, [
		supportsInstantSearch,
		isModuleEnabled,
		updateOptions,
		isInstantSearchEnabled,
		isDisabledFromOverLimit,
	] );

	const toggleInstantSearch = useCallback( () => {
		if ( isDisabledFromOverLimit ) {
			return;
		}

		const newOption = {
			instant_search_enabled: supportsInstantSearch && ! isInstantSearchEnabled,
		};
		if ( newOption.instant_search_enabled ) {
			newOption.module_active = true;
		}
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_instant_toggle', newOption );
	}, [ supportsInstantSearch, isInstantSearchEnabled, updateOptions, isDisabledFromOverLimit ] );

	return (
		<div
			className={ clsx( {
				'jp-form-settings-group jp-form-search-settings-group': true,
				'jp-form-search-settings-group--disabled': isDisabledFromOverLimit,
			} ) }
		>
			<Card
				className={ clsx( {
					'jp-form-has-child': true,
				} ) }
			>
				<div className="jp-form-search-settings-group-inside">
					<SearchToggle
						isModuleEnabled={ isModuleEnabled }
						isSavingEitherOption={ isSavingEitherOption }
						isTogglingModule={ isTogglingModule }
						supportsSearch={ supportsSearch }
						toggleSearchModule={ toggleSearchModule }
						isDisabledFromOverLimit={ isDisabledFromOverLimit }
					/>

					<InstantSearchToggle
						isInstantSearchEnabled={ isInstantSearchEnabled }
						isInstantSearchPromotionActive={ isInstantSearchPromotionActive }
						isModuleEnabled={ isModuleEnabled }
						isSavingEitherOption={ isSavingEitherOption }
						isTogglingInstantSearch={ isTogglingInstantSearch }
						returnUrl={ siteAdminUrl + RETURN_PATH }
						supportsInstantSearch={ supportsInstantSearch }
						supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
						toggleInstantSearch={ toggleInstantSearch }
						upgradeUrl={ upgradeUrl }
						isDisabledFromOverLimit={ isDisabledFromOverLimit }
					/>

					<ReaderChatControl
						isAvailable={ isReaderChatControlAvailable }
						isEnabled={ isReaderChatEnabled }
						isSaving={ isSavingEitherOption || isDisabledFromOverLimit }
						guidelinesUrl={ readerChatGuidelinesUrl }
						updateOptions={ updateOptions }
					/>

					<AIAgentAccessControl
						guidelinesUrl={ aiAgentAccessGuidelinesUrl }
						isAvailable={ isAIAgentAccessAvailable }
						showGuidelinesLink={ showAIAgentAccessGuidelinesLink }
					/>

					<SearchSuggestionsControl
						isEnabled={ isSearchSuggestionsEnabled }
						isInstantSearchEnabled={ isInstantSearchEnabled }
						supportsInstantSearch={ supportsInstantSearch }
						isSaving={ isSavingEitherOption }
						isDisabledFromOverLimit={ isDisabledFromOverLimit }
						updateOptions={ updateOptions }
					/>
				</div>
			</Card>
		</div>
	);
}

const InstantSearchToggle = ( {
	isInstantSearchEnabled,
	isInstantSearchPromotionActive,
	isSavingEitherOption,
	isModuleEnabled,
	isTogglingInstantSearch,
	returnUrl,
	supportsInstantSearch,
	supportsOnlyClassicSearch,
	toggleInstantSearch,
	upgradeUrl,
	isDisabledFromOverLimit,
} ) => {
	const isInstantSearchToggleChecked =
		isModuleEnabled && isInstantSearchEnabled && supportsInstantSearch && ! isDisabledFromOverLimit;
	const isInstantSearchToggleDisabled =
		isSavingEitherOption || ! supportsInstantSearch || isDisabledFromOverLimit;

	const isInstantSearchCustomizeButtonDisabled =
		isSavingEitherOption ||
		! isModuleEnabled ||
		! isInstantSearchEnabled ||
		! supportsInstantSearch ||
		isDisabledFromOverLimit;
	const isWidgetsEditorButtonDisabled =
		isSavingEitherOption ||
		! isModuleEnabled ||
		! isInstantSearchEnabled ||
		isDisabledFromOverLimit;

	return (
		<div className="jp-form-search-settings-group__toggle is-instant-search jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<ToggleControl
					checked={ isInstantSearchToggleChecked }
					disabled={ isInstantSearchToggleDisabled || isTogglingInstantSearch }
					onChange={ toggleInstantSearch }
					className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
					label={ createInterpolateElement(
						__(
							'Enable instant search experience <span>(recommended)</span>',
							'jetpack-search-pkg'
						),
						{ span: <span /> }
					) }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className="jp-search-dashboard-row">
				<div className="jp-form-search-settings-group__toggle-description lg-col-span-12 md-col-span-8 sm-col-span-4">
					{ supportsInstantSearch && (
						<Fragment>
							<p className="jp-form-search-settings-group__toggle-explanation">
								{ INSTANT_SEARCH_DESCRIPTION }
							</p>
						</Fragment>
					) }
					{ ! supportsInstantSearch && isInstantSearchPromotionActive && (
						<InstantSearchUpsellNudge href={ upgradeUrl } upgrade={ supportsOnlyClassicSearch } />
					) }
				</div>
			</div>
			{ supportsInstantSearch && (
				<InstantSearchButtons
					isInstantSearchCustomizeButtonDisabled={ isInstantSearchCustomizeButtonDisabled }
					isWidgetsEditorButtonDisabled={ isWidgetsEditorButtonDisabled }
					returnUrl={ returnUrl }
				/>
			) }
		</div>
	);
};

const InstantSearchButtons = ( {
	isInstantSearchCustomizeButtonDisabled,
	isWidgetsEditorButtonDisabled,
	returnUrl,
} ) => {
	return (
		<div className="jp-form-search-settings-group-buttons jp-search-dashboard-row">
			<Button
				variant="secondary"
				className="jp-form-search-settings-group-buttons__button is-customize-search lg-col-span-4 md-col-span-5 sm-col-span-4"
				href={
					! isInstantSearchCustomizeButtonDisabled
						? sprintf( SEARCH_CUSTOMIZE_URL, encodeURIComponent( returnUrl ) )
						: undefined
				}
				disabled={ isInstantSearchCustomizeButtonDisabled }
			>
				<span>{ __( 'Customize search results', 'jetpack-search-pkg' ) }</span>
			</Button>
			<div className="lg-col-span-0 md-col-span-1 sm-col-span-0"></div>

			<div className="lg-col-span-0 md-col-span-2 sm-col-span-1"></div>
			<Button
				variant="secondary"
				className="jp-form-search-settings-group-buttons__button is-widgets-editor lg-col-span-3 md-col-span-5 sm-col-span-4"
				href={
					! isWidgetsEditorButtonDisabled
						? sprintf( WIDGETS_EDITOR_URL, encodeURIComponent( returnUrl ) )
						: undefined
				}
				disabled={ isWidgetsEditorButtonDisabled }
			>
				<span>{ __( 'Edit sidebar widgets', 'jetpack-search-pkg' ) }</span>
			</Button>
		</div>
	);
};

const SearchToggle = ( {
	isModuleEnabled,
	isSavingEitherOption,
	isTogglingModule,
	supportsSearch,
	toggleSearchModule,
	isDisabledFromOverLimit,
} ) => {
	const isSearchToggleChecked = isModuleEnabled && supportsSearch && ! isDisabledFromOverLimit;
	const isSearchToggleDisabled =
		isSavingEitherOption || ! supportsSearch || isDisabledFromOverLimit;
	const isWpcom = useSelect( select => select( STORE_ID ).isWpcom(), [] );

	return (
		<div className="jp-form-search-settings-group__toggle is-search jp-search-dashboard-wrap">
			{ ! isWpcom && (
				<div className="jp-search-dashboard-row">
					<ToggleControl
						checked={ isSearchToggleChecked }
						disabled={ isSearchToggleDisabled || isTogglingModule }
						onChange={ toggleSearchModule }
						className="jp-search-dashboard-toggle lg-col-span-12 md-col-span-8 sm-col-span-4"
						label={ __( 'Enable Jetpack Search', 'jetpack-search-pkg' ) }
						__nextHasNoMarginBottom={ true }
					/>
				</div>
			) }
			<div className="jp-search-dashboard-row">
				<div className="jp-form-search-settings-group__toggle-description lg-col-span-12 md-col-span-8 sm-col-span-4">
					<p className="jp-form-search-settings-group__toggle-explanation">
						{ SEARCH_DESCRIPTION }
					</p>
				</div>
			</div>
		</div>
	);
};
