import { JetpackFooter, JetpackLogo } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import DonutMeterContainer from 'components/donut-meter-container';
import NoticesList from 'components/global-notices';
import Loading from 'components/loading';
import MockedSearch from 'components/mocked-search';
import ModuleControl from 'components/module-control';
import RecordMeter from 'components/record-meter';
import React from 'react';
import { STORE_ID } from 'store';
import './dashboard-page.scss';

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

	const renderDonutMeterTestSection = () => {
		return (
			<div className="jp-search-record-meter jp-search-dashboard-wrap">
				<div className="jp-search-dashboard-row">
					<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
					<div className="jp-search-record-meter__content lg-col-span-8 md-col-span-6 sm-col-span-4">
						<h2>
							{ createInterpolateElement(
								sprintf(
									// translators: %1$s: usage period, %2$s: plan name
									__( 'Your usage <s>%1$s (%2$s)</s>', 'jetpack-search-pkg' ),
									'Sep 28-Oct 28',
									__( 'Free plan', 'jetpack-search-pkg' )
								),
								{
									s: <span />,
								}
							) }
						</h2>
						<div className="donut-meter-group">
							<DonutMeterContainer
								title={ __( 'Site records', 'jetpack-search-pkg' ) }
								current={ 1250 }
								limit={ 5000 }
							/>
							<DonutMeterContainer
								title={ __( 'Search requests', 'jetpack-search-pkg' ) }
								current={ 125 }
								limit={ 500 }
							/>
						</div>
						<div className="upgrade-trigger">
							<div>
								{ __(
									'Do you want to increase your site records and search requests?',
									'jetpack-search-pkg'
								) }
							</div>
							<strong>
								{ __( 'Upgrade now and avoid any future interruption!', 'jetpack-search-pkg' ) }
							</strong>
							<svg
								width="19"
								height="15"
								viewBox="0 0 19 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M18.2969 7.50391C18.2969 7.11719 18.1328 6.71875 17.8633 6.44922L11.9102 0.519531C11.6055 0.214844 11.2539 0.0625 10.9141 0.0625C10.0703 0.0625 9.49609 0.648438 9.49609 1.42188C9.49609 1.85547 9.68359 2.18359 9.95312 2.45312L11.8164 4.32812L13.8555 6.19141L11.8516 6.07422H1.83203C0.941406 6.07422 0.34375 6.64844 0.34375 7.50391C0.34375 8.35938 0.941406 8.94531 1.83203 8.94531H11.8516L13.8555 8.82812L11.8164 10.6914L9.95312 12.5664C9.68359 12.8242 9.49609 13.1641 9.49609 13.5859C9.49609 14.3594 10.0703 14.9453 10.9141 14.9453C11.2539 14.9453 11.6055 14.793 11.9102 14.5L17.8633 8.57031C18.1328 8.30078 18.2969 7.90234 18.2969 7.50391Z"
									fill="#069E08"
								/>
							</svg>
						</div>
						<div className="record-meter-about">
							{ createInterpolateElement(
								__(
									'Tell me more about <u>record indexing and request limits</u>',
									'jetpack-search-pkg'
								),
								{
									u: <u />,
								}
							) }
						</div>
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
					<Header />
					<MockedSearchInterface
						supportsInstantSearch={ supportsInstantSearch }
						supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
					/>
					{ renderDonutMeterTestSection() }
					<RecordMeter
						postCount={ postCount }
						postTypeBreakdown={ postTypeBreakdown }
						tierMaximumRecords={ tierMaximumRecords }
						lastIndexedDate={ lastIndexedDate }
						postTypes={ postTypes }
					/>
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
					<Footer />
					<NoticesList
						notices={ notices }
						handleLocalNoticeDismissClick={ handleLocalNoticeDismissClick }
					/>
				</div>
			) }
		</>
	);
}

const MockedSearchInterface = ( { supportsInstantSearch, supportsOnlyClassicSearch } ) => {
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

const Footer = () => {
	const AUTOMATTIC_WEBSITE = 'https://automattic.com/';
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

const Header = () => {
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
