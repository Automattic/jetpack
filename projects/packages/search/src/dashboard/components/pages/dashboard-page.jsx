import { DonutMeter, Gridicon, JetpackFooter, JetpackLogo } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import NoticesList from 'components/global-notices';
import Loading from 'components/loading';
import MockedSearch from 'components/mocked-search';
import ModuleControl from 'components/module-control';
import RecordMeter from 'components/record-meter';
import React from 'react';
import { STORE_ID } from 'store';
import './dashboard-page.scss';

function DonutMeterWithLabels() {
	return (
		<div className="donut-meter-with-labels">
			<div className="donut-meter-wrapper">
				<DonutMeter />
			</div>
			<div className="donut-meter-info">
				<p className="donut-meter-primary">
					Site records{ ' ' }
					<a href="#" className="info-icon-wrapper">
						<Gridicon className="" icon="info-outline" size={ 16 } />
					</a>
				</p>
				<p className="donut-meter-secondary">
					212/500 <a href="#">Show details</a>
				</p>
			</div>
		</div>
	);
}

/**
 * SearchDashboard component definition.
 *
 * @param {object} props - Component properties.
 * @param {string} props.isLoading - should page show Loading spinner.
 * @returns {React.Component} Search dashboard component.
 */
export default function DashboardPage( { isLoading = false } ) {
	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );
	useSelect( select => select( STORE_ID ).getSearchModuleStatus(), [] );
	useSelect( select => select( STORE_ID ).getSearchStats(), [] );

	const isPageLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchModuleStatus' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchModuleStatus' ) ||
			select( STORE_ID ).isResolving( 'getSearchStats' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchStats' ) ||
			select( STORE_ID ).isResolving( 'getSearchPlanInfo' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPlanInfo' ) ||
			isLoading,
		[ isLoading ]
	);

	const siteAdminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl() );
	const AUTOMATTIC_WEBSITE = 'https://automattic.com/';

	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;
	const isInstantSearchPromotionActive = useSelect( select =>
		select( STORE_ID ).isInstantSearchPromotionActive()
	);

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug() );
	const upgradeBillPeriod = useSelect( select => select( STORE_ID ).getUpgradeBillPeriod() );

	const supportsOnlyClassicSearch = useSelect( select =>
		select( STORE_ID ).supportsOnlyClassicSearch()
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

	// Record Meter data
	const tierMaximumRecords = useSelect( select => select( STORE_ID ).getTierMaximumRecords() );
	const postCount = useSelect( select => select( STORE_ID ).getPostCount() );
	const postTypeBreakdown = useSelect( select => select( STORE_ID ).getPostTypeBreakdown() );
	const lastIndexedDate = useSelect( select => select( STORE_ID ).getLastIndexedDate() );
	const postTypes = useSelect( select => select( STORE_ID ).getPostTypes() );
	const handleLocalNoticeDismissClick = useDispatch( STORE_ID ).removeNotice;
	const notices = useSelect( select => select( STORE_ID ).getNotices(), [] );

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
						a8cLogoHref={ AUTOMATTIC_WEBSITE }
						moduleName={ __( 'Jetpack Search', 'jetpack-search-pkg' ) }
						className="lg-col-span-12 md-col-span-8 sm-col-span-4"
					/>
				</div>
			</div>
		);
	};

	const renderDonutMeterTestSection = () => {
		return (
			<div className="jp-search-record-meter jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
					<div className="jp-search-record-meter__content lg-col-span-8 md-col-span-6 sm-col-span-4">
						<h2>DonutMeter layout testing</h2>
						<DonutMeterWithLabels />
					</div>
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				</div>
			</div>
		);
	};

	return (
		<>
			{ isPageLoading && <Loading /> }
			{ ! isPageLoading && (
				<div className="jp-search-dashboard-page">
					{ renderHeader() }
					{ renderMockedSearchInterface() }
					{ renderDonutMeterTestSection() }
					<RecordMeter
						postCount={ postCount }
						postTypeBreakdown={ postTypeBreakdown }
						tierMaximumRecords={ tierMaximumRecords }
						lastIndexedDate={ lastIndexedDate }
						postTypes={ postTypes }
					/>
					{ renderModuleControl() }
					{ renderFooter() }
					<NoticesList
						notices={ notices }
						handleLocalNoticeDismissClick={ handleLocalNoticeDismissClick }
					/>
				</div>
			) }
		</>
	);
}
