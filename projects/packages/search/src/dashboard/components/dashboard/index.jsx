/**
 * External dependencies
 */
import React, { Fragment, useMemo } from 'react';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch, select as syncSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { JetpackFooter, JetpackLogo, Spinner } from '@automattic/jetpack-components';
import ModuleControl from 'components/module-control';
import MockedSearch from 'components/mocked-search';
import { STORE_ID } from 'store';
import NoticesList from 'components/global-notices';

import 'scss/rna-styles.scss';
import './style.scss';

/**
 * SearchDashboard component definition.
 *
 * @returns {React.Component} Search dashboard component.
 */
export default function SearchDashboard() {
	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );
	useSelect( select => select( STORE_ID ).getSearchModuleStatus(), [] );

	const siteAdminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl() );
	const aboutPageUrl = siteAdminUrl + 'admin.php?page=jetpack_about';

	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;
	const isInstantSearchPromotionActive = useSelect( select =>
		select( STORE_ID ).isInstantSearchPromotionActive()
	);

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug() );
	const upgradeBillPeriod = useSelect( select => select( STORE_ID ).getUpgradeBillPeriod() );

	const supportsOnlyClassicSearch = useSelect(
		select => select( STORE_ID ).supportsOnlyClassicSearch
	);
	const supportsSearch = useSelect( select => select( STORE_ID ).supportsSearch() );
	const supportsInstantSearch = useSelect( select => select( STORE_ID ).supportsInstantSearch() );
	const isModuleEnabled = useSelect( select => select( STORE_ID ).isModuleEnabled() );
	const isInstantSearchEnabled = useSelect( select => select( STORE_ID ).isInstantSearchEnabled() );
	const isSavingEitherOption = useSelect( select =>
		select( STORE_ID ).isUpdatingJetpackSettings()
	);
	const isTogglingModule = useSelect( select => select( STORE_ID ).isTogglingModule() );
	const isTogglingInstantSearch = useSelect( select =>
		select( STORE_ID ).isTogglingInstantSearch()
	);

	const isLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchPlanInfo' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPlanInfo' ) ||
			select( STORE_ID ).isResolving( 'getSearchModuleStatus' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchModuleStatus' )
	);

	const handleLocalNoticeDismissClick = useDispatch( STORE_ID ).removeNotice;
	const notices = useSelect( select => select( STORE_ID ).getNotices(), [] );

	const initializeAnalytics = () => {
		const tracksUser = syncSelect( STORE_ID ).getWpcomUser();
		const blogId = syncSelect( STORE_ID ).getBlogId();

		if ( tracksUser ) {
			analytics.initialize( tracksUser.ID, tracksUser.login, {
				blog_id: blogId,
			} );
		}
	};

	useMemo( () => {
		const apiRootUrl = syncSelect( STORE_ID ).getAPIRootUrl();
		const apiNonce = syncSelect( STORE_ID ).getAPINonce();
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
		initializeAnalytics();
		analytics.tracks.recordEvent( 'jetpack_search_admin_page_view', {
			current_version: syncSelect( STORE_ID ).getVersion(),
		} );
	}, [] );

	const renderHeader = () => {
		return (
			<div className="jp-search-dashboard-header jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-12 md-col-span-8 sm-col-span-4">
						<div className="jp-search-dashboard-header__logo-container">
							<JetpackLogo className="jp-search-dashboard-header__masthead" />
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderMockedSearchInterface = () => {
		return (
			<div className="jp-search-dashboard-top jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="jp-search-dashboard-top__title lg-col-span-6 md-col-span-7 sm-col-span-4">
						<h1>
							{ __(
								"Help your visitors find exactly what they're looking for, fast",
								'jetpack-search-pkg'
							) }
						</h1>
					</div>
					<div className=" lg-col-span-6 md-col-span-1 sm-col-span-0"></div>
				</div>
				<div className="jp-search-dashboard-row" aria-hidden="true">
					<div className="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
					<div className="jp-search-dashboard-top__mocked-search-interface lg-col-span-10 md-col-span-6 sm-col-span-4">
						<MockedSearch
							supportsInstantSearch={ supportsInstantSearch }
							supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
						/>
					</div>
					<div className="lg-col-span-1 md-col-span-1 sm-col-span-0"></div>
				</div>
			</div>
		);
	};

	const renderModuleControl = () => {
		return (
			<div className="jp-search-dashboard-bottom">
				<ModuleControl
					siteAdminUrl={ siteAdminUrl }
					updateOptions={ updateOptions }
					domain={ domain }
					isInstantSearchPromotionActive={ isInstantSearchPromotionActive }
					upgradeBillPeriod={ upgradeBillPeriod }
					supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
					supportsSearch={ supportsSearch }
					supportsInstantSearch={ supportsInstantSearch }
					isModuleEnabled={ isModuleEnabled }
					isInstantSearchEnabled={ isInstantSearchEnabled }
					isSavingEitherOption={ isSavingEitherOption }
					isTogglingModule={ isTogglingModule }
					isTogglingInstantSearch={ isTogglingInstantSearch }
				/>
			</div>
		);
	};

	const renderFooter = () => {
		return (
			<div className="jp-search-dashboard-footer jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<JetpackFooter
						a8cLogoHref={ aboutPageUrl }
						moduleName={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
						className="lg-col-span-12 md-col-span-8 sm-col-span-4"
					/>
				</div>
			</div>
		);
	};

	return (
		<div className="jp-search-dashboard-page">
			{ isLoading && (
				<Spinner className="jp-search-dashboard-page-loading-spinner" color="#000" size={ 32 } />
			) }
			{ ! isLoading && (
				<Fragment>
					{ renderHeader() }
					{ renderMockedSearchInterface() }
					{ renderModuleControl() }
					{ renderFooter() }
				</Fragment>
			) }
			<NoticesList
				notices={ notices }
				handleLocalNoticeDismissClick={ handleLocalNoticeDismissClick }
			/>
		</div>
	);
}
