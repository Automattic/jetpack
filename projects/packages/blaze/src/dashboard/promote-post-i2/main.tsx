import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, EmptyState, Link, Notice, Tabs } from '@wordpress/ui';
import { useState } from 'react';
import DocumentHead from '../compat/components/document-head';
import config from '../compat/config';
import page from '../compat/router';
import { useSelector, getSelectedSite } from '../compat/state';
import { localizeUrl } from '../compat/utils';
import {
	BlazablePost,
	BlazePagedItem,
	Campaign,
	CampaignQueryResult,
	PromotePostWarning,
} from '../data/promote-post/types';
import useBillingSummaryQuery from '../data/promote-post/use-promote-post-billing-summary-query';
import useCampaignsQueryPaged from '../data/promote-post/use-promote-post-campaigns-query-paged';
import { usePaymentsQuery } from '../data/promote-post/use-promote-post-payments-query';
import usePostsQueryPaged, {
	usePostsQueryStats,
} from '../data/promote-post/use-promote-post-posts-query-paged';
import { useJetpackBlazeVersionCheck } from '../lib/promote-post';
import BlazePage from './components/blaze-page';
import BlazePageViewTracker from './components/blaze-page-view-tracker';
import CampaignsList from './components/campaigns-list';
import CampaignsTotalStats from './components/campaigns-total-stats';
import CreditsNotice from './components/credits-notice';
import MainWrapper from './components/main-wrapper';
import PaymentLinks from './components/payment-links';
import PaymentsList from './components/payments-list';
import { PaymentReceipt } from './components/payments-receipt';
import PostsList, { postsNotReadyErrorMessage } from './components/posts-list';
import PromotePostTabBar from './components/promoted-post-filter';
import { SORT_OPTIONS_DEFAULT, SearchOptions } from './components/search-bar';
import useOpenPromoteWidget from './hooks/use-open-promote-widget';
import { getAdvertisingDashboardPath, getPagedBlazeSearchData } from './utils';
import './style.scss';

export const TAB_OPTIONS = [ 'posts', 'campaigns', 'credits', 'payments' ] as const;
const isWooStore = config.isEnabled( 'is_running_in_woo_site' );
export type TabType = ( typeof TAB_OPTIONS )[ number ];
export type TabOption = {
	id: TabType;
	name: string;
	itemCount?: number;
	isCountAmount?: boolean;
	className?: string;
	enabled?: boolean;
	label?: string;
};

interface Props {
	tab?: TabType;
	receiptId?: number;
}

export type DSPMessage = {
	errorCode?: string;
};

export type PagedBlazeContentData = {
	has_more_pages: boolean;
	total_items?: number;
	items?: BlazePagedItem[];
	warnings?: PromotePostWarning[];
	campaigns_stats?: {
		total_impressions: number;
		total_clicks: number;
	};
	tsp_eligible: boolean;
};

const POST_DEFAULT_SEARCH_OPTIONS: SearchOptions = {
	order: SORT_OPTIONS_DEFAULT,
	filter: {
		postType: isWooStore ? 'product' : '',
	},
};

/**
 *
 * @param root0
 * @param root0.tab
 * @param root0.receiptId
 */
export default function PromotedPosts( { tab, receiptId }: Props ) {
	// Credits has no tab of its own: its balance shows in the tab strip.
	const selectedTab = tab && tab !== 'credits' && TAB_OPTIONS.includes( tab ) ? tab : 'posts';
	const selectedSite = useSelector( getSelectedSite );
	const selectedSiteId = selectedSite?.ID || 0;
	const onClickPromote = useOpenPromoteWidget( {
		keyValue: 'post-0', // post 0 means to open post selector in widget
		entrypoint: 'promoted_posts-header',
	} );

	/* query for campaigns */
	const [ campaignsSearchOptions, setCampaignsSearchOptions ] = useState< SearchOptions >( {} );
	const campaignsQuery = useCampaignsQueryPaged( selectedSiteId ?? 0, campaignsSearchOptions );
	const {
		fetchNextPage: fetchCampaignsNextPage,
		data: campaignsData,
		isLoading: campaignsIsLoading,
		isFetchingNextPage: campaignIsFetching,
		error: campaignError,
		isRefetching: campaignIsRefetching,
	} = campaignsQuery;

	const campaignIsLoadingNewContent = campaignsIsLoading || campaignIsRefetching;

	const queryClient = useQueryClient();
	const initialCampaignQueryState = queryClient.getQueryState( [
		'promote-post-campaigns',
		selectedSiteId,
		'',
	] );

	const { data, isLoading: isLoadingBillingSummary } = useBillingSummaryQuery();

	const [ fetchPaymentsForCurrentSite, setFetchPaymentsForCurrentSite ] = useState( true );
	const arePaymentsEnabled = useJetpackBlazeVersionCheck( selectedSiteId, '14.9-alpha', '0.8.0' );
	/* query for payments */
	const {
		data: payments,
		isLoading: isLoadingPayments,
		isFetching: isFetchingPayments,
		error: paymentsError,
	} = usePaymentsQuery(
		arePaymentsEnabled,
		fetchPaymentsForCurrentSite ? selectedSiteId : undefined
	);

	const paymentBlocked = data?.paymentsBlocked ?? false;

	const shouldDisplayDebtAndPaymentLinks =
		! isLoadingBillingSummary &&
		data?.debt !== undefined &&
		! data?.paymentsBlocked &&
		data?.paymentLinks &&
		data?.paymentLinks.length > 0 &&
		parseFloat( data.debt ) > 0 &&
		selectedTab !== 'payments';

	const {
		has_more_pages: campaignsHasMorePages,
		items: pagedCampaigns,
		campaigns_stats: campaignsStats,
	} = getPagedBlazeSearchData( 'campaigns', campaignsData );

	const { total_items: totalCampaignsUnfiltered } = getPagedBlazeSearchData(
		'campaigns',
		initialCampaignQueryState?.data as InfiniteData< CampaignQueryResult >
	);

	/* query for posts */
	const { data: postsStatsData } = usePostsQueryStats( selectedSiteId ?? 0 );
	const { total_items: totalPostsUnfiltered } = postsStatsData || {};

	const [ postsSearchOptions, setPostsSearchOptions ] = useState< SearchOptions >(
		POST_DEFAULT_SEARCH_OPTIONS
	);
	const postsQuery = usePostsQueryPaged( selectedSiteId ?? 0, postsSearchOptions );

	const {
		fetchNextPage: fetchPostsNextPage,
		data: postsData,
		isLoading: postsIsLoading,
		isFetchingNextPage: postIsFetching,
		error: postError,
		isRefetching: postIsRefetching,
	} = postsQuery;

	const postsIsLoadingNewContent = postsIsLoading || postIsRefetching;

	const {
		has_more_pages: postsHasMorePages,
		items: posts,
		warnings: postsWarnings,
	} = getPagedBlazeSearchData( 'posts', postsData );

	const tabs: TabOption[] = [
		{
			id: 'posts',
			name: __( 'Ready to promote', 'jetpack-blaze' ),
			itemCount: totalPostsUnfiltered,
			label: __( 'Posts', 'jetpack-blaze' ),
		},
		{
			id: 'campaigns',
			name: __( 'Campaigns', 'jetpack-blaze' ),
			itemCount: totalCampaignsUnfiltered,
			label: __( 'Campaigns', 'jetpack-blaze' ),
		},
	];

	if ( arePaymentsEnabled ) {
		tabs.push( {
			id: 'payments',
			name: __( 'Payments', 'jetpack-blaze' ),
			className: 'payments',
			itemCount: payments?.total,
			label: __( 'Payments', 'jetpack-blaze' ),
		} );
	}

	if ( selectedSite?.is_coming_soon || selectedSite?.is_private ) {
		return (
			<EmptyState.Root className="campaigns-empty">
				<EmptyState.Title>
					{ selectedSite?.is_coming_soon
						? __( 'Site is not published', 'jetpack-blaze' )
						: __( 'Site is private', 'jetpack-blaze' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ createInterpolateElement(
						sprintf(
							/* translators: %(productName)s is the product name, Blaze Ads. */ __(
								'To start using %(productName)s, you must make your site public. You can do that from <sitePrivacySettingsLink>here</sitePrivacySettingsLink>.',
								'jetpack-blaze'
							),
							{ productName: 'Blaze Ads' }
						),
						{
							sitePrivacySettingsLink: (
								<Link href={ `/settings/reading/${ selectedSite.domain }` } />
							),
						}
					) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	const renderWarningNotices = ( warnings?: PromotePostWarning[] ) => {
		const content = [];

		for ( const item of warnings ?? [] ) {
			switch ( item ) {
				case 'sync_in_progress':
					content.push(
						<Notice.Root key={ item } intent="info" className="promote-post-notice">
							<Notice.Description>{ postsNotReadyErrorMessage() }</Notice.Description>
						</Notice.Root>
					);
					break;
			}
		}

		return content.length ? (
			<div className="promote-post-i2__warnings-wrapper promote-post-i2__aux-wrapper">
				{ content }
			</div>
		) : null;
	};

	return (
		<MainWrapper>
			<DocumentHead title="Blaze Ads" />

			<BlazePage
				actions={
					<Button onClick={ onClickPromote } disabled={ isLoadingBillingSummary || paymentBlocked }>
						{ __( 'Promote', 'jetpack-blaze' ) }
					</Button>
				}
			>
				<Tabs.Root
					value={ selectedTab }
					onValueChange={ value =>
						page( getAdvertisingDashboardPath( `/${ value }/${ selectedSite?.slug }` ) )
					}
				>
					<div className="promote-post-i2 promote-post-i2__page-body">
						<CampaignsTotalStats
							totalImpressions={ campaignsStats?.total_impressions }
							totalClicks={ campaignsStats?.total_clicks }
							isLoading={ campaignsIsLoading }
						/>

						<PromotePostTabBar tabs={ tabs } selectedTab={ selectedTab } />

						<div className="promote-post-i2__aux-wrapper promote-post-credits__notice-container">
							<CreditsNotice />
						</div>

						{ ! isLoadingBillingSummary && paymentBlocked && (
							<Notice.Root intent="error" className="promote-post-i2__payment-blocked-notice">
								<Notice.Description>
									{ createInterpolateElement(
										__(
											'Your account does not have the capabilities to promote. <wpcomSupport>Reach out to us</wpcomSupport> for support.',
											'jetpack-blaze'
										),
										{
											wpcomSupport: (
												<Link
													href={ localizeUrl( 'https://wordpress.com/help/contact' ) }
													openInNewTab
												/>
											),
										}
									) }
								</Notice.Description>
							</Notice.Root>
						) }

						{ shouldDisplayDebtAndPaymentLinks && (
							<>
								<Notice.Root intent="error" className="promote-post-i2__payment-blocked-notice">
									<Notice.Description>
										{ sprintf(
											/* translators: %(debtAmount)s is the outstanding balance. */ __(
												'Your account currently has an outstanding balance of $%(debtAmount)s. Please resolve this using the links below before creating new campaigns.',
												'jetpack-blaze'
											),
											{
												debtAmount: data.debt || '',
												// this is just a fallback. debt should never be undefined
												// it is checked in shouldDisplayDebtAndPaymentLinks
											}
										) }
									</Notice.Description>
								</Notice.Root>
								<PaymentLinks payment_links={ data?.paymentLinks } />
							</>
						) }

						<Tabs.Panel value="campaigns">
							{ selectedTab === 'campaigns' && (
								<>
									<BlazePageViewTracker
										path={ getAdvertisingDashboardPath( '/campaigns/:site' ) }
										title="Advertising > Campaigns"
									/>
									<CampaignsList
										isLoading={ campaignIsLoadingNewContent }
										isFetching={ campaignIsFetching }
										isError={ campaignError as DSPMessage }
										fetchNextPage={ fetchCampaignsNextPage }
										handleSearchOptions={ setCampaignsSearchOptions }
										totalCampaigns={ totalCampaignsUnfiltered || 0 }
										hasMorePages={ campaignsHasMorePages }
										campaigns={ pagedCampaigns as Campaign[] }
									/>
								</>
							) }
						</Tabs.Panel>

						{ arePaymentsEnabled && (
							<Tabs.Panel value="payments">
								{ selectedTab === 'payments' && (
									<>
										<BlazePageViewTracker
											path={ getAdvertisingDashboardPath(
												receiptId ? '/payments/receipt/:receiptId/:site' : '/payments/:site'
											) }
											title={
												receiptId ? 'Advertising > Payment Receipt' : 'Advertising > Payments'
											}
										/>

										{ receiptId ? (
											<div className="payment-receipt-container">
												<div className="payment-receipt-container__header">
													<Button
														variant="minimal"
														className="payment-receipt-container__back-button"
														onClick={ () =>
															page(
																getAdvertisingDashboardPath( `/payments/${ selectedSite?.slug }` )
															)
														}
													>
														{ __( '← Back to payments', 'jetpack-blaze' ) }
													</Button>
												</div>
												<PaymentReceipt paymentId={ receiptId } />
											</div>
										) : (
											<PaymentsList
												isLoading={ isLoadingPayments }
												isError={ paymentsError as DSPMessage }
												isFetching={ isFetchingPayments }
												payments={ payments?.payments }
												selectedPaymentsFilter={ fetchPaymentsForCurrentSite }
												setFetchPaymentsForCurrentSite={ setFetchPaymentsForCurrentSite }
											/>
										) }
									</>
								) }
							</Tabs.Panel>
						) }

						<Tabs.Panel value="posts">
							{ selectedTab === 'posts' && (
								<>
									{ renderWarningNotices( postsWarnings ) }

									<BlazePageViewTracker
										path={ getAdvertisingDashboardPath( '/posts/:site' ) }
										title="Advertising > Ready to Promote"
									/>
									<PostsList
										isLoading={ postsIsLoadingNewContent }
										isFetching={ postIsFetching }
										isError={ postError as DSPMessage }
										fetchNextPage={ fetchPostsNextPage }
										handleSearchOptions={ setPostsSearchOptions }
										totalCampaigns={ totalPostsUnfiltered || 0 }
										hasMorePages={ postsHasMorePages }
										posts={ posts as BlazablePost[] }
										hasPaymentsBlocked={ paymentBlocked }
									/>
								</>
							) }
						</Tabs.Panel>
					</div>
				</Tabs.Root>
			</BlazePage>
		</MainWrapper>
	);
}
