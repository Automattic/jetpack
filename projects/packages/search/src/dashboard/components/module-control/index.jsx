/**
 * External dependencies
 */
import React, { Fragment, useCallback } from 'react';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import Button from 'components/button';
import Card from 'components/card';
import CompactFormToggle from 'components/form-toggle/compact';
import InstantSearchUpsellNudge from 'components/upsell-nudge';

import 'scss/rna-styles.scss';
import './style.scss';

const SEARCH_DESCRIPTION = __(
	'Jetpack Search is an incredibly powerful and customizable replacement for the search capability built into WordPress that helps your visitors find the right content.',
	'jetpack-search-pkg'
);
const INSTANT_SEARCH_DESCRIPTION = __(
	'Instant search will allow your visitors to get search results as soon as they start typing. If deactivated, Jetpack Search will still optimize your search results but visitors will have to submit a search query before seeing any results.',
	'jetpack-search-pkg'
);
const RETURN_PATH = 'admin.php?page=jetpack-search';
const SEARCH_CUSTOMIZE_URL = 'admin.php?page=jetpack-search-configure';
const WIDGETS_EDITOR_URL = 'customize.php?autofocus[panel]=widgets&return=%s';

/**
 * Search settings component to be used within the Performance section.
 *
 * @param {object} props - Component properties.
 * @param {string} props.domain - Calypso slug.
 * @param {string} props.siteAdminUrl - site admin URL.
 * @param {string} props.upgradeBillPeriod - billing cycle for upgrades.
 * @param {Function} props.updateOptions - function to update settings.
 * @param {boolean} props.isSavingEitherOption - true if Saving options.
 * @param {boolean} props.isModuleEnabled - true if Search module is enabled.
 * @param {boolean} props.isInstantSearchEnabled - true if Instant Search is enabled.
 * @param {boolean} props.isInstantSearchPromotionActive - true if search promotion is active.
 * @param {boolean} props.supportsOnlyClassicSearch - true if site has plan that supports only Classic Search.
 * @param {boolean} props.supportsSearch - true if site has plan that supports either Classic or Instant Search.
 * @param {boolean} props.supportsInstantSearch - true if site has plan that supports Instant Search.
 * @param {boolean} props.isTogglingModule - true if toggling Search module.
 * @param {boolean} props.isTogglingInstantSearch - true if toggling Instant Search option.
 * @returns {React.Component}	Search settings component.
 */
export default function SearchModuleControl( {
	siteAdminUrl,
	updateOptions,
	domain,
	isSavingEitherOption,
	isModuleEnabled,
	isInstantSearchEnabled,
	isInstantSearchPromotionActive,
	upgradeBillPeriod,
	supportsOnlyClassicSearch,
	supportsSearch,
	supportsInstantSearch,
	isTogglingModule,
	isTogglingInstantSearch,
} ) {
	const isInstantSearchCustomizeButtonDisabled =
		isSavingEitherOption ||
		! isModuleEnabled ||
		! isInstantSearchEnabled ||
		! supportsInstantSearch;
	const isWidgetsEditorButtonDisabled = isSavingEitherOption || ! isModuleEnabled;
	const returnUrl = encodeURIComponent( siteAdminUrl + RETURN_PATH );
	const upgradeUrl = getRedirectUrl(
		upgradeBillPeriod === 'monthly' ? 'jetpack-search-monthly' : 'jetpack-search',
		{ site: domain }
	);

	const toggleSearchModule = useCallback( () => {
		const newOption = {
			module_active: ! isModuleEnabled,
		};
		if ( isInstantSearchEnabled !== ! isModuleEnabled ) {
			newOption.instant_search_enabled = ! isModuleEnabled && supportsInstantSearch;
		}
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_module_toggle', newOption );
	}, [ supportsInstantSearch, isModuleEnabled, updateOptions, isInstantSearchEnabled ] );

	const toggleInstantSearch = useCallback( () => {
		const newOption = {
			instant_search_enabled: supportsInstantSearch && ! isInstantSearchEnabled,
		};
		if ( newOption.instant_search_enabled ) {
			newOption.module_active = true;
		}
		updateOptions( newOption );
		analytics.tracks.recordEvent( 'jetpack_search_instant_toggle', newOption );
	}, [ supportsInstantSearch, isInstantSearchEnabled, updateOptions ] );

	const renderInstantSearchButtons = () => {
		return (
			<div className="jp-form-search-settings-group-buttons jp-search-dashboard-row">
				<div className="lg-col-span-3 md-col-span-2 sm-col-span-1"></div>
				<Button
					className="jp-form-search-settings-group-buttons__button is-customize-search lg-col-span-4 md-col-span-5 sm-col-span-3"
					href={
						! isInstantSearchCustomizeButtonDisabled
							? sprintf( SEARCH_CUSTOMIZE_URL, returnUrl )
							: undefined
					}
					disabled={ isInstantSearchCustomizeButtonDisabled }
				>
					<span>{ __( 'Customize search results', 'jetpack-search-pkg' ) }</span>
				</Button>
				<div className="lg-col-span-0 md-col-span-1 sm-col-span-0"></div>

				<div className="lg-col-span-0 md-col-span-2 sm-col-span-1"></div>
				<Button
					className="jp-form-search-settings-group-buttons__button is-widgets-editor lg-col-span-3 md-col-span-5 sm-col-span-3"
					href={
						! isWidgetsEditorButtonDisabled ? sprintf( WIDGETS_EDITOR_URL, returnUrl ) : undefined
					}
					disabled={ isWidgetsEditorButtonDisabled }
				>
					<span>{ __( 'Edit sidebar widgets', 'jetpack-search-pkg' ) }</span>
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
					<CompactFormToggle
						checked={ isModuleEnabled && supportsSearch }
						disabled={ isSavingEitherOption || ! supportsSearch }
						onChange={ toggleSearchModule }
						toggling={ isTogglingModule }
						className="is-search-admin"
						switchClassNames="lg-col-span-1 md-col-span-1 sm-col-span-1"
						labelClassNames=" lg-col-span-7 md-col-span-5 sm-col-span-3"
						aria-label={ __( 'Enable Jetpack Search', 'jetpack-search-pkg' ) }
					>
						{ __( 'Enable Jetpack Search', 'jetpack-search-pkg' ) }
					</CompactFormToggle>
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
					<CompactFormToggle
						checked={ isModuleEnabled && isInstantSearchEnabled && supportsInstantSearch }
						disabled={ isSavingEitherOption || ! supportsInstantSearch }
						onChange={ toggleInstantSearch }
						toggling={ isTogglingInstantSearch }
						className="is-search-admin"
						switchClassNames="lg-col-span-1 md-col-span-1 sm-col-span-1"
						labelClassNames=" lg-col-span-7 md-col-span-5 sm-col-span-3"
						aria-label={ __(
							'Enable instant search experience (recommended)',
							'jetpack-search-pkg'
						) }
					>
						{ createInterpolateElement(
							__(
								'Enable instant search experience <span>(recommended)</span>',
								'jetpack-search-pkg'
							),
							{ span: <span /> }
						) }
					</CompactFormToggle>
				</div>
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-3 md-col-span-2 sm-col-span-1"></div>
					<div className="jp-form-search-settings-group__toggle-description lg-col-span-7 md-col-span-5 sm-col-span-3">
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
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				</div>
				{ supportsInstantSearch && renderInstantSearchButtons() }
			</div>
		);
	};

	return (
		<div className="jp-form-settings-group jp-form-search-settings-group">
			<Card
				className={ classNames( {
					'jp-form-has-child': true,
					'jp-form-settings-disable': false,
				} ) }
			>
				<div className="jp-form-search-settings-group-inside">
					{ renderSearchToggle() }
					{ renderInstantSearchToggle() }
				</div>
			</Card>
		</div>
	);
}
