import {
	JetpackFooter,
	JetpackLogo,
	ThemeProvider,
	ContextualUpgradeTrigger,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import DonutMeterContainer from 'components/donut-meter-container';
import NoticesList from 'components/global-notices';
import Loading from 'components/loading';
import MockedSearch from 'components/mocked-search';
import ModuleControl from 'components/module-control';
import RecordMeter from 'components/record-meter';
import React, { useCallback } from 'react';
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

	// Prepare Checkout action and loading status
	const { fetchSearchPlanInfo } = useDispatch( STORE_ID );
	const checkSiteHasSearchProduct = useCallback(
		() => fetchSearchPlanInfo().then( response => response?.supports_search ),
		[ fetchSearchPlanInfo ]
	);
	const { run: sendPaidPlanToCart, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: 'jetpack_search',
		redirectUrl: `${ siteAdminUrl }admin.php?page=jetpack-search`,
		siteProductAvailabilityHandler: checkSiteHasSearchProduct,
		from: 'jetpack-search',
		siteSuffix: domain,
	} );

	const isPageLoading = useSelect(
		select =>
			select( STORE_ID ).isResolving( 'getSearchModuleStatus' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchModuleStatus' ) ||
			select( STORE_ID ).isResolving( 'getSearchStats' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchStats' ) ||
			select( STORE_ID ).isResolving( 'getSearchPlanInfo' ) ||
			! select( STORE_ID ).hasStartedResolution( 'getSearchPlanInfo' ) ||
			isLoading ||
			hasCheckoutStarted,
		[ isLoading, hasCheckoutStarted ]
	);

	// Introduce the gate for new pricing with URL parameter `new_pricing_202208=1`
	const isNewPricing = useSelect( select => select( STORE_ID ).isNewPricing202208(), [] );

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
					<FirstRunSection isVisible={ false } />
					<PlanUsageSection isVisible={ false } />
					{ isNewPricing && <UsageMeter sendPaidPlanToCart={ sendPaidPlanToCart } /> }
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

const PlanSummary = ( { latestMonthRequests } ) => {
	const tierSlug = useSelect( select => select( STORE_ID ).getTierSlug() );

	const startDate = new Date( latestMonthRequests.start_date );
	const endDate = new Date( latestMonthRequests.end_date );

	const localeOptions = {
		month: 'short',
		day: '2-digit',
	};

	// Leave the locale as `undefined` to apply the browser host locale.
	const startDateText = startDate.toLocaleDateString( undefined, localeOptions );
	const endDateText = endDate.toLocaleDateString( undefined, localeOptions );

	let planText = __( 'Paid Plan', 'jetpack-search-pkg' );
	if ( ! tierSlug ) {
		planText = __( 'Free Plan', 'jetpack-search-pkg' );
	}

	return (
		<h2>
			{ createInterpolateElement(
				sprintf(
					// translators: %1$s: Usage period, %2$s: Plan name
					__( 'Your usage <s>%1$s (%2$s)</s>', 'jetpack-search-pkg' ),
					`${ startDateText }-${ endDateText }`,
					planText
				),
				{
					s: <span />,
				}
			) }
		</h2>
	);
};

const UsageMeter = ( { sendPaidPlanToCart } ) => {
	const upgradeTriggerArgs = {
		description: __(
			'Do you want to increase your site records and search requests?',
			'jetpack-search-pkg'
		),
		cta: __( 'Upgrade now and avoid any future interruption!', 'jetpack-search-pkg' ),
		onClick: sendPaidPlanToCart,
	};

	const currentPlan = useSelect( select => select( STORE_ID ).getCurrentPlan() );
	const currentUsage = useSelect( select => select( STORE_ID ).getCurrentUsage() );
	const latestMonthRequests = useSelect( select => select( STORE_ID ).getLatestMonthRequests() );

	// @TODO Apply the real data `plan_usage.should_upgrade` and `plan_usage.upgrade_reason` after testing
	let mustUpgradeReason = '';
	if ( latestMonthRequests.num_requests > currentPlan.monthly_search_request_limit ) {
		mustUpgradeReason = 'requests';
	}
	if ( currentUsage.num_records > currentPlan.record_limit ) {
		mustUpgradeReason = mustUpgradeReason === 'requests' ? 'both' : 'records';
	}

	return (
		<div className="jp-search-dashboard-wrap jp-search-dashboard-meter-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-dashboard-meter-wrap__content lg-col-span-8 md-col-span-6 sm-col-span-4">
					<PlanSummary latestMonthRequests={ latestMonthRequests } />
					<div className="usage-meter-group">
						<DonutMeterContainer
							title={ __( 'Site records', 'jetpack-search-pkg' ) }
							current={ currentUsage.num_records }
							limit={ currentPlan.record_limit }
						/>
						<DonutMeterContainer
							title={ __( 'Search requests', 'jetpack-search-pkg' ) }
							current={ latestMonthRequests.num_requests }
							limit={ currentPlan.monthly_search_request_limit }
						/>
					</div>

					{ mustUpgradeReason && (
						<ThemeProvider>
							<ContextualUpgradeTrigger { ...upgradeTriggerArgs } />
						</ThemeProvider>
					) }

					<div className="usage-meter-about">
						{ createInterpolateElement(
							__(
								'Tell me more about <jpPlanLimits>record indexing and request limits</jpPlanLimits>.',
								'jetpack-search-pkg'
							),
							{
								jpPlanLimits: (
									<a
										href="https://jetpack.com/support/search/"
										rel="noopener noreferrer"
										target="_blank"
										className="support-link"
									/>
								),
							}
						) }
					</div>
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
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
