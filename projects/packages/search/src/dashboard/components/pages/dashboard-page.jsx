import {
	JetpackFooter,
	JetpackSearchLogo,
	Button,
	Container,
	Col,
	getProductCheckoutUrl,
} from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import NoticesList from 'components/global-notices';
import Loading from 'components/loading';
import MockedSearch from 'components/mocked-search';
import ModuleControl from 'components/module-control';
import RecordMeter from 'components/record-meter';
import React from 'react';
import { STORE_ID } from 'store';
import FirstRunSection from './sections/first-run-section';
import PlanUsageSection from './sections/plan-usage-section';
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

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug() );
	const siteAdminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl() );
	const { hasConnectionError } = useConnectionErrorNotice();

	const sendPaidPlanToCart = () => {
		const checkoutProductUrl = getProductCheckoutUrl(
			'jetpack_search',
			domain,
			`${ siteAdminUrl }admin.php?page=jetpack-search&just_upgraded=1`,
			true
		);

		window.location.href = checkoutProductUrl;
	};

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

	// Introduce the gate for new pricing with URL parameter `new_pricing_202208=1`
	const isNewPricing = useSelect( select => select( STORE_ID ).isNewPricing202208(), [] );

	const isFreePlan = useSelect( select => select( STORE_ID ).isFreePlan() );
	const isOverLimit = useSelect( select => select( STORE_ID ).isOverLimit() );
	const isDisabledFromOverLimitOnFreePlan = isOverLimit && isFreePlan;

	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;
	const isInstantSearchPromotionActive = useSelect( select =>
		select( STORE_ID ).isInstantSearchPromotionActive()
	);

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

	// Plan Info data
	const recordMeterInfo = {
		lastIndexedDate,
		postCount,
		postTypeBreakdown,
		postTypes,
		tierMaximumRecords,
	};

	return (
		<>
			{ isPageLoading && <Loading /> }
			{ ! isPageLoading && (
				<div className="jp-search-dashboard-page">
					<Header
						isUpgradable={ ( isNewPricing && isFreePlan ) || ! supportsInstantSearch }
						sendPaidPlanToCart={ sendPaidPlanToCart }
					/>
					{ hasConnectionError && (
						<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
							<Col lg={ 12 } md={ 12 } sm={ 12 }>
								<ConnectionError />
							</Col>
						</Container>
					) }
					<MockedSearchInterface
						supportsInstantSearch={ supportsInstantSearch }
						supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
					/>
					{ isNewPricing && supportsInstantSearch && (
						<PlanInfo
							hasIndex={ postCount !== 0 }
							recordMeterInfo={ recordMeterInfo }
							isFreePlan={ isFreePlan }
							sendPaidPlanToCart={ sendPaidPlanToCart }
						/>
					) }
					{ ! isNewPricing && supportsInstantSearch && (
						<RecordMeter
							postCount={ postCount }
							postTypeBreakdown={ postTypeBreakdown }
							tierMaximumRecords={ tierMaximumRecords }
							lastIndexedDate={ lastIndexedDate }
							postTypes={ postTypes }
						/>
					) }
					<div className="jp-search-dashboard-bottom">
						<ModuleControl
							siteAdminUrl={ siteAdminUrl }
							updateOptions={ updateOptions }
							domain={ domain }
							isDisabledFromOverLimit={ isDisabledFromOverLimitOnFreePlan }
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

const PlanInfo = ( { hasIndex, recordMeterInfo, isFreePlan, sendPaidPlanToCart } ) => {
	// Site Info
	// TODO: Investigate why this isn't returning anything useful.
	const siteTitle = useSelect( select => select( STORE_ID ).getSiteTitle() ) || 'your site';
	// Plan Info data
	const currentPlan = useSelect( select => select( STORE_ID ).getCurrentPlan() );
	const currentUsage = useSelect( select => select( STORE_ID ).getCurrentUsage() );
	const latestMonthRequests = useSelect( select => select( STORE_ID ).getLatestMonthRequests() );
	const planInfo = { currentPlan, currentUsage, latestMonthRequests, isFreePlan };

	const isPlanJustUpgraded = useSelect( select => select( STORE_ID ).isPlanJustUpgraded(), [] );

	return (
		<>
			{ ! hasIndex && <FirstRunSection siteTitle={ siteTitle } planInfo={ planInfo } /> }
			{ hasIndex && (
				<>
					<PlanUsageSection
						isFreePlan={ isFreePlan }
						isPlanJustUpgraded={ isPlanJustUpgraded }
						planInfo={ planInfo }
						sendPaidPlanToCart={ sendPaidPlanToCart }
					/>
					<RecordMeter
						postCount={ recordMeterInfo.postCount }
						postTypeBreakdown={ recordMeterInfo.postTypeBreakdown }
						tierMaximumRecords={ recordMeterInfo.tierMaximumRecords }
						lastIndexedDate={ recordMeterInfo.lastIndexedDate }
						postTypes={ recordMeterInfo.postTypes }
					/>
				</>
			) }
		</>
	);
};

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

const Header = ( { isUpgradable, sendPaidPlanToCart } ) => {
	const buttonLinkArgs = {
		children: __( 'Upgrade Jetpack Search', 'jetpack-search-pkg' ),
		variant: 'link',
		onClick: sendPaidPlanToCart,
	};

	return (
		<div className="jp-search-dashboard-header jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-12 md-col-span-8 sm-col-span-4">
					<div className="jp-search-dashboard-header__logo-container">
						<JetpackSearchLogo className="jp-search-dashboard-header__masthead" />
						{ isUpgradable && <Button { ...buttonLinkArgs } /> }
					</div>
				</div>
			</div>
		</div>
	);
};
