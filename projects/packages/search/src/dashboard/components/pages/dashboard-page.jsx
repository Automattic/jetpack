import { AdminPage, Button, getProductCheckoutUrl } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Stack, Tabs } from '@wordpress/ui';
import { useEffect, useState } from 'react';
import AIAgentAccessControl from 'components/ai-agent-access-control';
import AiAnswersTab from 'components/ai-answers-tab';
import ExperienceSelector from 'components/experience-selector';
import NoticesList from 'components/global-notices';
import Loading from 'components/loading';
import MockedSearch from 'components/mocked-search';
import ModuleControl from 'components/module-control';
import ReaderChatControl from 'components/reader-chat-control';
import RecordMeter from 'components/record-meter';
import SearchSuggestionsControl from 'components/search-suggestions-control';
import WooCommerceProductSearchControl from 'components/woocommerce-product-search-control';
import { STORE_ID } from 'store';
import { EXPERIENCE } from '../experience-selector/constants';
import FirstRunSection from './sections/first-run-section';
import OverviewSection from './sections/overview-section';
import './dashboard-page.scss';

const DEFAULT_TAB = 'overview';
// Keep this allowlist in sync with the <Tabs.Tab value="..."> definitions below.
const VALID_TABS = [ DEFAULT_TAB, 'settings', 'ai-answers' ];
// Tabs are now routed via the URL hash (#/<slug>) to match the my-jetpack
// admin's HashRouter convention. The pre-hash `?tab=<slug>` query param is
// still honored on mount so existing bookmarks resolve correctly; mount-time
// normalization rewrites the URL to the canonical hash form.
const LEGACY_TAB_QUERY_PARAM = 'tab';
// Maps removed slugs to their current equivalents so existing bookmarks/links keep working.
const LEGACY_TAB_ALIASES = { 'plan-usage': 'overview' };
// Experiences whose product search reads `override_woocommerce_search_template`:
// Embedded/Inline swap WooCommerce's product-search page for the Jetpack
// product-results template; overlay_blocks paints the product overlay. The
// legacy preact Overlay has no blocks template, so it's absent.
const PRODUCT_SEARCH_OVERRIDE_EXPERIENCES = [
	EXPERIENCE.EMBEDDED,
	EXPERIENCE.INLINE,
	EXPERIENCE.OVERLAY_BLOCKS,
];

const resolveTabFromLocation = () => {
	if ( typeof window === 'undefined' ) {
		return DEFAULT_TAB;
	}

	// Hash wins (canonical); fall back to legacy `?tab=` query param.
	const fromHash = window.location.hash.replace( /^#\/?/, '' );
	const fromQuery = new URLSearchParams( window.location.search ).get( LEGACY_TAB_QUERY_PARAM );
	const requestedTab = fromHash || fromQuery;
	const resolvedTab = LEGACY_TAB_ALIASES[ requestedTab ] ?? requestedTab;

	return VALID_TABS.includes( resolvedTab ) ? resolvedTab : DEFAULT_TAB;
};

// Rewrites the URL to the canonical `#/<tab>` form and strips any legacy
// `?tab=` query param. Uses `replaceState` so it doesn't add a back-button
// entry and doesn't fire a `hashchange` event (safe to call from a
// `hashchange` handler).
const normalizeUrlToHash = tab => {
	if ( typeof window === 'undefined' ) {
		return;
	}
	const url = new URL( window.location.href );
	const desiredHash = `#/${ tab }`;
	if ( url.hash === desiredHash && ! url.searchParams.has( LEGACY_TAB_QUERY_PARAM ) ) {
		return;
	}
	url.searchParams.delete( LEGACY_TAB_QUERY_PARAM );
	url.hash = desiredHash;
	// Preserve any existing history.state — assigning {} would clobber state
	// stashed by other scripts running on the same admin page.
	window.history.replaceState( window.history.state ?? {}, '', url.toString() );
};

/**
 * SearchDashboard component definition.
 *
 * @param {object} props           - Component properties.
 * @param {string} props.isLoading - should page show Loading spinner.
 *
 * @return {import('react').Component} Search dashboard component.
 */
export default function DashboardPage( { isLoading = false } ) {
	const [ activeTab, setActiveTab ] = useState( resolveTabFromLocation );

	// On mount, canonicalize the URL to `#/<tab>` and drop any legacy `?tab=`
	// query string so reloads stop carrying it.
	useEffect( () => {
		normalizeUrlToHash( activeTab );
		// Intentional: canonicalize once with the initial `activeTab`. Later
		// hash changes are handled by the `hashchange` listener below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Keep the active tab in sync with external hash changes (back/forward button, manual edit).
	useEffect( () => {
		if ( typeof window === 'undefined' ) {
			return;
		}
		const onHashChange = () => {
			const resolved = resolveTabFromLocation();
			// Skip the state update when the resolved tab already matches —
			// otherwise user-initiated clicks would `setActiveTab` twice (once
			// in `handleTabChange`, once via the `hashchange` event echo).
			setActiveTab( prev => ( prev === resolved ? prev : resolved ) );
			// External nav might have landed on a legacy slug; canonicalize too.
			normalizeUrlToHash( resolved );
		};
		window.addEventListener( 'hashchange', onHashChange );
		return () => window.removeEventListener( 'hashchange', onHashChange );
	}, [] );

	const handleTabChange = tab => {
		setActiveTab( tab );

		if ( typeof window === 'undefined' ) {
			return;
		}
		// Assigning to .hash (not replaceState) creates a back-button entry,
		// matching my-jetpack's HashRouter navigation behavior.
		window.location.hash = `/${ tab }`;
	};

	useSelect( select => select( STORE_ID ).getSearchPlanInfo(), [] );
	useSelect( select => select( STORE_ID ).getSearchModuleStatus(), [] );
	useSelect( select => select( STORE_ID ).getSearchStats(), [] );

	const apiRoot = useSelect( select => select( STORE_ID ).getAPIRootUrl() );
	const apiNonce = useSelect( select => select( STORE_ID ).getAPINonce() );
	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug() );
	const blogID = useSelect( select => select( STORE_ID ).getBlogId() );
	const siteAdminUrl = useSelect( select => select( STORE_ID ).getSiteAdminUrl() );
	const readerChatGuidelinesUrl = useSelect( select =>
		select( STORE_ID ).getReaderChatGuidelinesUrl()
	);
	const aiAgentAccessGuidelinesUrl = useSelect( select =>
		select( STORE_ID ).getAIAgentAccessGuidelinesUrl()
	);
	const isAIAgentAccessAvailable = useSelect( select =>
		select( STORE_ID ).isAIAgentAccessAvailable()
	);
	const { hasConnectionError } = useConnectionErrorNotice();

	const sendPaidPlanToCart = () => {
		const checkoutProductUrl = getProductCheckoutUrl(
			'jetpack_search',
			blogID || domain,
			`admin.php?page=jetpack-search&just_upgraded=1`,
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

	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;
	const isInstantSearchPromotionActive = useSelect( select =>
		select( STORE_ID ).isInstantSearchPromotionActive()
	);

	const supportsOnlyClassicSearch = useSelect( select =>
		select( STORE_ID ).supportsOnlyClassicSearch()
	);
	const supportsSearch = useSelect( select => select( STORE_ID ).supportsSearch() );
	const supportsInstantSearch = useSelect( select => select( STORE_ID ).supportsInstantSearch() );
	const isModuleEnabled = useSelect( select => select( STORE_ID ).isModuleEnabled() );
	const isInstantSearchEnabled = useSelect( select => select( STORE_ID ).isInstantSearchEnabled() );
	const isReaderChatAvailable = useSelect( select => select( STORE_ID ).isReaderChatAvailable() );
	const isReaderChatEnabled = useSelect( select => select( STORE_ID ).isReaderChatEnabled() );
	const isSavingEitherOption = useSelect( select =>
		select( STORE_ID ).isUpdatingJetpackSettings()
	);
	const isTogglingModule = useSelect( select => select( STORE_ID ).isTogglingModule() );
	const isTogglingInstantSearch = useSelect( select =>
		select( STORE_ID ).isTogglingInstantSearch()
	);
	const isSearchBlocksEnabled = useSelect( select => select( STORE_ID ).isSearchBlocksEnabled() );
	const isSearchSuggestionsEnabled = useSelect( select =>
		select( STORE_ID ).isSearchSuggestionsEnabled()
	);
	const isWooCommerceActive = useSelect( select => select( STORE_ID ).isWooCommerceActive() );
	const isWooCommerceSearchTemplateOverrideEnabled = useSelect( select =>
		select( STORE_ID ).isWooCommerceSearchTemplateOverrideEnabled()
	);
	const activeExperience = useSelect( select => select( STORE_ID ).getActiveExperience() );
	const activeThemeStylesheet = useSelect( select =>
		select( STORE_ID ).getActiveThemeStylesheet()
	);
	const showWooCommerceProductSearchControl =
		isWooCommerceActive && PRODUCT_SEARCH_OVERRIDE_EXPERIENCES.includes( activeExperience );
	const isBlockTheme = useSelect( select => select( STORE_ID ).isBlockTheme() );
	const productSearchTemplate = useSelect( select =>
		select( STORE_ID ).getProductSearchTemplateConfig()
	);
	const productOverlayTemplate = useSelect( select =>
		select( STORE_ID ).getProductOverlayTemplateConfig()
	);
	// The edit affordance follows the active experience. Overlay (blocks) edits its
	// product template via the singleton CPT (post.php, any theme) and gets a
	// "Restore default". Embedded/Inline edit the product-results page template —
	// the Site Editor on block themes (which owns its own revert, so no restore
	// link there), the Product_Search_Template singleton CPT on classic themes.
	// Singleton editor URLs are null for non-admins, so `SingletonTemplateActions`
	// disables the link in that state.
	const isProductOverlayExperience = activeExperience === EXPERIENCE.OVERLAY_BLOCKS;
	let wooProductTemplate;
	if ( isProductOverlayExperience ) {
		wooProductTemplate = {
			templateConfig: productOverlayTemplate,
			editTemplateUrl: null,
			editLabel: __( 'Edit the product Search overlay', 'jetpack-search-pkg' ),
			restoreConfirmMessage: __(
				'Restore the bundled product Search overlay template? Your customizations will be deleted.',
				'jetpack-search-pkg'
			),
			successMessage: __(
				'The product Search overlay template has been restored to the bundled default.',
				'jetpack-search-pkg'
			),
			errorMessage: __(
				'Could not restore the product Search overlay template.',
				'jetpack-search-pkg'
			),
		};
	} else if ( isBlockTheme ) {
		wooProductTemplate = {
			templateConfig: null,
			editTemplateUrl: activeThemeStylesheet
				? `${ siteAdminUrl }site-editor.php?p=%2Fwp_template%2F${ encodeURIComponent(
						activeThemeStylesheet
				  ) }%2F%2Fjetpack-search-product-results&canvas=edit`
				: `${ siteAdminUrl }site-editor.php?p=%2Ftemplate`,
			editLabel: __( 'Edit the product search template', 'jetpack-search-pkg' ),
		};
	} else {
		wooProductTemplate = {
			templateConfig: productSearchTemplate,
			editTemplateUrl: null,
			editLabel: __( 'Edit the product search template', 'jetpack-search-pkg' ),
			restoreConfirmMessage: __(
				'Restore the bundled product search template? Your customizations will be deleted.',
				'jetpack-search-pkg'
			),
			successMessage: __(
				'The product search template has been restored to the bundled default.',
				'jetpack-search-pkg'
			),
			errorMessage: __( 'Could not restore the product search template.', 'jetpack-search-pkg' ),
		};
	}
	const showAIAgentAccessGuidelinesLink =
		! isReaderChatAvailable ||
		! supportsSearch ||
		! isReaderChatEnabled ||
		readerChatGuidelinesUrl !== aiAgentAccessGuidelinesUrl;
	const isReaderChatControlAvailable = isReaderChatAvailable && supportsSearch;
	const hasAdditionalSettings =
		isReaderChatControlAvailable ||
		isAIAgentAccessAvailable ||
		( supportsInstantSearch && isInstantSearchEnabled ) ||
		showWooCommerceProductSearchControl;

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
		<div className="jp-search-dashboard-page">
			<AdminPage
				title={ 'Search' /** "Search" is a product name, do not translate. */ }
				subTitle={ __(
					'Help your visitors find exactly what they are looking for.',
					'jetpack-search-pkg'
				) }
				actions={
					! isPageLoading &&
					( ( isNewPricing && isFreePlan ) || ! supportsInstantSearch ) && (
						<Button size="compact" variant="link" onClick={ sendPaidPlanToCart }>
							{ __( 'Upgrade Jetpack Search', 'jetpack-search-pkg' ) }
						</Button>
					)
				}
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				className="uses-new-admin-ui"
			>
				<NoticesList
					notices={ notices }
					handleLocalNoticeDismissClick={ handleLocalNoticeDismissClick }
				/>
				<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
					<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
						<Tabs.List variant="minimal">
							<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-search-pkg' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-search-pkg' ) }</Tabs.Tab>
							<Tabs.Tab value="ai-answers">
								{ __( 'AI Answers', 'jetpack-search-pkg' ) }
								<span className="jp-search-dashboard-tabs__tab-preview-label">
									&nbsp;{ __( '(Preview)', 'jetpack-search-pkg' ) }
								</span>
							</Tabs.Tab>
						</Tabs.List>
					</div>
					<Tabs.Panel value="overview">
						<div className="jp-search-dashboard-top jp-search-dashboard-wrap">
							{ /* Always in the DOM so JITM JS finds it immediately (Path A). */ }
							<div className="jp-search-dashboard-row">
								<div
									id="jp-admin-notices"
									className="jetpack-search-jitm-card sm-col-span-4 md-col-span-8 lg-col-span-12"
								/>
							</div>
							{ isPageLoading && <Loading /> }
							{ ! isPageLoading && (
								<MockedSearchContent
									supportsInstantSearch={ supportsInstantSearch }
									supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
								/>
							) }
						</div>
						{ ! isPageLoading && (
							<>
								{ hasConnectionError && (
									<Stack direction="column">
										<ConnectionError />
									</Stack>
								) }
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
							</>
						) }
					</Tabs.Panel>
					<Tabs.Panel value="settings">
						{ isPageLoading && <Loading /> }
						{ ! isPageLoading && (
							<>
								<div className="jp-search-dashboard-bottom">
									{ isSearchBlocksEnabled ? (
										<div className="jp-search-dashboard-wrap jp-search-experience-selector-wrap">
											<div className="jp-search-dashboard-row">
												<div className="lg-col-span-12 md-col-span-8 sm-col-span-4">
													<ExperienceSelector />
													{ hasAdditionalSettings && (
														<h2
															id="jp-search-additional-settings-heading"
															className="jp-search-additional-settings__heading"
														>
															{ __( 'Additional settings', 'jetpack-search-pkg' ) }
														</h2>
													) }
													{ isReaderChatControlAvailable && (
														<div className="jp-search-settings-card">
															<ReaderChatControl
																isAvailable={ isReaderChatControlAvailable }
																isEnabled={ isReaderChatEnabled }
																isSaving={ isSavingEitherOption || isOverLimit }
																guidelinesUrl={ readerChatGuidelinesUrl }
																updateOptions={ updateOptions }
															/>
														</div>
													) }
													<AIAgentAccessControl
														className="jp-search-ai-agent-access-card"
														guidelinesUrl={ aiAgentAccessGuidelinesUrl }
														isAvailable={ isAIAgentAccessAvailable }
														showGuidelinesLink={ showAIAgentAccessGuidelinesLink }
													/>
													{ supportsInstantSearch && isInstantSearchEnabled && (
														<div className="jp-search-settings-card">
															<SearchSuggestionsControl
																isEnabled={ isSearchSuggestionsEnabled }
																isInstantSearchEnabled={ isInstantSearchEnabled }
																supportsInstantSearch={ supportsInstantSearch }
																isSaving={ isSavingEitherOption }
																isDisabledFromOverLimit={ isOverLimit }
																updateOptions={ updateOptions }
															/>
														</div>
													) }
													{ showWooCommerceProductSearchControl && (
														<div className="jp-search-settings-card">
															<WooCommerceProductSearchControl
																isEnabled={ isWooCommerceSearchTemplateOverrideEnabled }
																isSaving={ isSavingEitherOption }
																updateOptions={ updateOptions }
																templateConfig={ wooProductTemplate.templateConfig }
																editTemplateUrl={ wooProductTemplate.editTemplateUrl }
																editLabel={ wooProductTemplate.editLabel }
																restoreConfirmMessage={ wooProductTemplate.restoreConfirmMessage }
																successMessage={ wooProductTemplate.successMessage }
																errorMessage={ wooProductTemplate.errorMessage }
															/>
														</div>
													) }
												</div>
											</div>
										</div>
									) : (
										<ModuleControl
											siteAdminUrl={ siteAdminUrl }
											updateOptions={ updateOptions }
											domain={ domain }
											isDisabledFromOverLimit={ isOverLimit }
											isInstantSearchPromotionActive={ isInstantSearchPromotionActive }
											isAIAgentAccessAvailable={ isAIAgentAccessAvailable }
											isReaderChatAvailable={ isReaderChatAvailable }
											isReaderChatEnabled={ isReaderChatEnabled }
											supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
											supportsSearch={ supportsSearch }
											supportsInstantSearch={ supportsInstantSearch }
											isModuleEnabled={ isModuleEnabled }
											isInstantSearchEnabled={ isInstantSearchEnabled }
											isSavingEitherOption={ isSavingEitherOption }
											isTogglingModule={ isTogglingModule }
											isTogglingInstantSearch={ isTogglingInstantSearch }
											aiAgentAccessGuidelinesUrl={ aiAgentAccessGuidelinesUrl }
											readerChatGuidelinesUrl={ readerChatGuidelinesUrl }
											isSearchSuggestionsEnabled={ isSearchSuggestionsEnabled }
										/>
									) }
								</div>
								<NoticesList
									notices={ notices }
									handleLocalNoticeDismissClick={ handleLocalNoticeDismissClick }
								/>
							</>
						) }
					</Tabs.Panel>
					<Tabs.Panel value="ai-answers">
						<AiAnswersTab />
					</Tabs.Panel>
				</Tabs.Root>
			</AdminPage>
		</div>
	);
}

const PlanInfo = ( { hasIndex, recordMeterInfo, isFreePlan, sendPaidPlanToCart } ) => {
	// Site Info
	// TODO: Investigate why this isn't returning anything useful.
	const siteTitle =
		useSelect( select => select( STORE_ID ).getSiteTitle() ) ||
		__( 'your site', 'jetpack-search-pkg' );
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
					<OverviewSection
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

const MockedSearchContent = ( { supportsInstantSearch, supportsOnlyClassicSearch } ) => {
	return (
		<>
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
				<div className="jp-search-dashboard-top__mocked-search-interface lg-col-span-12 md-col-span-8 sm-col-span-4">
					<MockedSearch
						supportsInstantSearch={ supportsInstantSearch }
						supportsOnlyClassicSearch={ supportsOnlyClassicSearch }
					/>
				</div>
			</div>
		</>
	);
};
