import { AdminPage } from '@automattic/jetpack-components';
import { DropdownMenu } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronLeft, external } from '@wordpress/icons';
import {
	AlertDialog,
	Badge,
	Button,
	ButtonLink,
	Dialog,
	Icon,
	Link,
	Notice,
	Spinner,
} from '@wordpress/ui';
import clsx from 'clsx';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { recordTracksEvent } from '../../../compat/analytics';
import config from '../../../compat/config';
import page from '../../../compat/router';
import { useSelector, getSelectedSiteSlug } from '../../../compat/state';
import { localizeUrl } from '../../../compat/utils';
import SupportLink from '../../../components/support-link';
import {
	CampaignChartSeriesData,
	ChartResolution,
	useCampaignChartStatsQuery,
} from '../../../data/promote-post/use-campaign-chart-stats-query';
import useBillingSummaryQuery from '../../../data/promote-post/use-promote-post-billing-summary-query';
import {
	CampaignResponse,
	Order,
} from '../../../data/promote-post/use-promote-post-campaigns-query';
import useCancelCampaignMutation from '../../../data/promote-post/use-promote-post-cancel-campaign-mutation';
import { useJetpackBlazeVersionCheck } from '../../../lib/promote-post';
import useOpenPromoteWidget from '../../hooks/use-open-promote-widget';
import {
	campaignStatus,
	canCancelCampaign,
	canGetCampaignStats,
	canPromoteAgainCampaign,
	formatAmount,
	getAdvertisingDashboardPath,
	getCampaignActiveDays,
	getCampaignDurationFormatted,
	formatCents,
	formatNumber,
	getCampaignStatus,
	getCampaignStatusBadgeIntent,
} from '../../utils';
import AdPreview from '../ad-preview';
import CampaignStatsLineChart from '../campaign-stats-line-chart/src/campaign-stats-line-chart';
import LocationChart from '../location-charts';
import PaymentLinks from '../payment-links';
import TspMetricsBanner from '../tsp-metrics-banner';
import AdPreviewModal from './AdPreviewModal';
import CampaignDownloadStats from './CampaignDownloadStats';
import DetailsInfoPopover from './details-info-popover';
import TargetLocations from './target-locations';
import './style.scss';

interface Props {
	isLoading?: boolean;
	siteId: number;
	campaign: CampaignResponse;
}

const FlexibleSkeleton = () => {
	return <div className="campaign-item-details__flexible-skeleton" />;
};

type SupportErrorDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
};

const SupportErrorDialog = ( { isOpen, onClose, title }: SupportErrorDialogProps ) => {
	const onContactSupport = () => {
		onClose();
		window.open( localizeUrl( 'https://wordpress.com/support/' ), '_blank' );
	};

	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="small" className="campaign-item-details__error-dialog">
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
				</Dialog.Header>
				<Dialog.Content>
					<Dialog.Description>
						{ __(
							'Please try again later or contact support if the problem persists.',
							'jetpack-blaze'
						) }
					</Dialog.Description>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" onClick={ onContactSupport }>
						{ __( 'Contact support', 'jetpack-blaze' ) }
					</Button>
					<Dialog.Action>{ __( 'Ok', 'jetpack-blaze' ) }</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const getPostIdFromURN = ( targetUrn: string ) => {
	if ( ! targetUrn.includes( ':' ) ) {
		return;
	}

	const splitted = targetUrn.split( ':' );
	if ( splitted.length >= 4 ) {
		return splitted[ 4 ];
	}
};

const getExternalTabletIcon = ( fillColor = '#A7AAAD' ) => (
	<span className="campaign-item-details__tablet-icon">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M14 16L10 16V17.5H14V16Z" fill={ fillColor } />
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M5 6C5 4.89543 5.89543 4 7 4L17 4C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20H7C5.89543 20 5 19.1046 5 18L5 6ZM7 5.5L17 5.5C17.2761 5.5 17.5 5.72386 17.5 6V18C17.5 18.2761 17.2761 18.5 17 18.5H7C6.72386 18.5 6.5 18.2761 6.5 18L6.5 6C6.5 5.72386 6.72386 5.5 7 5.5Z"
				fill={ fillColor }
			/>
		</svg>
	</span>
);

export enum ChartSourceOptions {
	Impressions = 'impressions',
	Clicks = 'clicks',
	Spend = 'spend',
}

// Define the available date range options
enum ChartSourceDateRanges {
	YESTERDAY = 'yesterday',
	LAST_7_DAYS = 'last_7_days',
	LAST_14_DAYS = 'last_14_days',
	LAST_30_DAYS = 'last_30_days',
	LAST_3_MONTHS = 'last_3_months',
	LAST_6_MONTHS = 'last_6_months',
	LAST_YEAR = 'last_year',
	WHOLE_CAMPAIGN = 'whole_campaign',
}

// User facing strings for date ranges
const ChartSourceDateRangeLabels = {
	[ ChartSourceDateRanges.YESTERDAY ]: __( 'Yesterday', 'jetpack-blaze' ),
	[ ChartSourceDateRanges.LAST_7_DAYS ]: __( 'Last 7 days', 'jetpack-blaze' ),
	[ ChartSourceDateRanges.LAST_14_DAYS ]: __( 'Last 14 days', 'jetpack-blaze' ),
	[ ChartSourceDateRanges.LAST_30_DAYS ]: __( 'Last 30 days', 'jetpack-blaze' ),
	[ ChartSourceDateRanges.LAST_3_MONTHS ]: __( 'Last 3 months', 'jetpack-blaze' ),
	[ ChartSourceDateRanges.LAST_6_MONTHS ]: __( 'Last 6 months', 'jetpack-blaze' ),
	[ ChartSourceDateRanges.LAST_YEAR ]: __( 'Last year', 'jetpack-blaze' ),
	[ ChartSourceDateRanges.WHOLE_CAMPAIGN ]: __( 'Whole Campaign', 'jetpack-blaze' ),
};

const HIDE_TSP_METRICS_BANNER_COOKIE = 'blaze-hide-tsp-metrics-banner';

const setHideTspMetricsBannerCookie = ( value: boolean ) => {
	document.cookie = serializeCookie( HIDE_TSP_METRICS_BANNER_COOKIE, ( +value ).toString(), {
		path: '/',
		maxAge: 365 * 24 * 60 * 60, // 1 year
	} );
};

/**
 *
 * @param props
 */
export default function CampaignItemDetails( props: Props ) {
	const [ showDeleteDialog, setShowDeleteDialog ] = useState( false );
	const [ showErrorDialog, setShowErrorDialog ] = useState( false );
	const [ chartSource, setChartSource ] = useState< ChartSourceOptions >(
		ChartSourceOptions.Clicks
	);
	const { cancelCampaign } = useCancelCampaignMutation( () => setShowErrorDialog( true ) );
	const selectedSiteSlug = useSelector( getSelectedSiteSlug );
	const { campaign, isLoading, siteId } = props;
	const campaignId = campaign?.campaign_id || 0;
	const isWooStore = config.isEnabled( 'is_running_in_woo_site' );
	const { data, isLoading: isLoadingBillingSummary } = useBillingSummaryQuery();
	const paymentBlocked = data?.paymentsBlocked ?? false;

	const [ showReportErrorDialog, setShowReportErrorDialog ] = useState( false );
	const [ showAllReplies, setShowAllReplies ] = useState( false );

	const getEffectiveEndDate = () => {
		const endDate = campaign?.end_date ? new Date( campaign.end_date ) : null;
		const today = new Date();

		// If the campaign has already finished, fetch data relative to the end date (we can't fetch data after that point)
		return endDate && endDate < today ? endDate : today;
	};

	const {
		audience_list,
		content_config,
		start_date,
		end_date,
		display_name,
		creative_html,
		width,
		height,
		status,
		ui_status,
		campaign_stats,
		billing_data,
		target_urn,
		campaign_id,
		created_at,
		format,
		budget_cents,
		type,
		display_delivery_estimate,
		display_clicks_estimate,
		is_evergreen = false,
	} = campaign || {};

	const {
		impressions_total = 0,
		clicks_total,
		clickthrough_rate,
		duration_days,
		total_budget,
		total_budget_used,
		weekly_budget_used,
		conversions_total,
		conversion_value,
		conversion_rate,
		conversion_last_currency_found,
		tsp,
	} = campaign_stats || {};

	const {
		impressions_total: tsp_impressions_total,
		// todo uncomment this line when we check that clicks are tracked through smart
		// clicks_total: tsp_clicks_total,
		replies,
		likes_total,
		replies_total,
		permalink,
	} = tsp || {};

	const displayedReplies = showAllReplies ? replies : replies?.slice( 0, 3 );

	// check if delivery outperformed
	const calculateOutperformPercentage = ( estimates: string, total: number ): number => {
		const tempValues = ( estimates || '' ).split( ':' );
		let median = 0;
		if ( tempValues && tempValues.length >= 2 ) {
			const [ minValue, maxValue ] = tempValues.map( Number );
			median = ( minValue + maxValue ) / 2;
		}
		if ( is_evergreen ) {
			// Calculate the duration in weeks from the start date.
			// Add 1 to ensure the minimum value is 1 week (avoiding division by zero or values less than 1).
			// This ensures clicks are divided by the total whole number of weeks that have elapsed since the start date.
			const durationInWeeksFromStartDate =
				moment.utc().diff( moment.utc( start_date ), 'weeks' ) + 1;
			// The total is divided by the number of weeks,
			// as the estimated values are calculated on a weekly basis.
			total = Math.round( total / durationInWeeksFromStartDate );
		}
		if ( total > median && median > 0 ) {
			return Math.round( ( ( total - median ) / median ) * 100 );
		}
		return 0;
	};

	// for impressions
	const impressionsOutperformedPercentage = calculateOutperformPercentage(
		display_delivery_estimate,
		impressions_total
	);

	// for clicks
	const clicksOutperformedPercentage = calculateOutperformPercentage(
		display_clicks_estimate,
		clicks_total
	);

	const { card_name, payment_method, credits, total, orders, payment_links } = billing_data || {};
	const { title, clickUrl } = content_config || {};
	const canDisplayPaymentSection =
		orders && orders.length > 0 && ( payment_method || ! isNaN( total || 0 ) );

	const onClickPromote = useOpenPromoteWidget( {
		keyValue: `post-${ getPostIdFromURN( target_urn || '' ) }_campaign-${ campaign_id }`,
		entrypoint: 'promoted_posts-campaign-details-header',
	} );

	// Target block
	const {
		devices: devicesList,
		topics: topicsList,
		languages: languagesList,
	} = audience_list || {};

	// Formatted labels
	const cpcFormatted =
		total_budget_used && clicks_total && clicks_total > 0
			? `$${ formatCents( total_budget_used / clicks_total, 2 ) }`
			: '-';
	const ctrFormatted = clickthrough_rate ? `${ clickthrough_rate.toFixed( 2 ) }%` : '-';
	const clicksFormatted = clicks_total && clicks_total > 0 ? formatNumber( clicks_total ) : '-';
	const likesFormatted = likes_total && likes_total > 0 ? formatNumber( likes_total ) : '-';
	const repliesFormatted = replies_total && replies_total > 0 ? formatNumber( replies_total ) : '-';
	const tspImpressionsFormatted =
		tsp_impressions_total && tsp_impressions_total > 0
			? formatNumber( tsp_impressions_total )
			: '-';
	// todo uncomment this line when we check that clicks are tracked through smart
	// const tspClicksFormatted =
	// 	tsp_clicks_total && tsp_clicks_total > 0 ? formatNumber( tsp_clicks_total ) : '-';
	const dailyBudgetFormatted = `$${ formatCents( ( budget_cents || 0 ) / 100, 2 ) }`;
	const weeklyBudget = budget_cents ? ( budget_cents / 100 ) * 7 : 0;
	const weeklySpend = weekly_budget_used || 0;

	const weeklySpendFormatted = `$${ formatCents( weeklySpend, 2 ) }`;

	const displayBudget = is_evergreen ? weeklyBudget : total_budget;
	const totalBudgetFormatted = `$${ formatCents( displayBudget || 0, 2 ) }`;

	const campaignTitleFormatted = title || __( 'Untitled', 'jetpack-blaze' );
	const campaignCreatedFormatted = moment.utc( created_at ).format( 'MMMM DD, YYYY' );
	const campaignStartFormatted = moment.utc( start_date ).format( 'MMMM DD, YYYY' );

	const devicesListFormatted = devicesList ? `${ devicesList }` : __( 'All', 'jetpack-blaze' );
	const languagesListFormatted = languagesList
		? `${ languagesList }`
		: __( 'All languages', 'jetpack-blaze' );
	const topicsListFormatted = topicsList ? `${ topicsList }` : __( 'All', 'jetpack-blaze' );
	const impressionsTotal = formatNumber( impressions_total );
	const creditsFormatted = `$${ formatCents( credits || 0 ) }`;
	const totalFormatted = `$${ formatCents( total || 0, 2 ) }`;
	const conversionsTotalFormatted = conversions_total ? conversions_total : '-';
	const conversionValueFormatted =
		conversion_last_currency_found && conversion_value
			? formatAmount(
					conversion_value[ conversion_last_currency_found ],
					conversion_last_currency_found
				)
			: '-';
	const conversionsRateFormatted = conversion_rate
		? `${ ( conversion_rate * 100 ).toFixed( 2 ) }%`
		: '-';

	const activeDays = getCampaignActiveDays( start_date, end_date );

	const durationDateFormatted = getCampaignDurationFormatted(
		start_date,
		end_date,
		is_evergreen,
		campaign?.ui_status
	);

	const durationDateAndTimeFormatted = getCampaignDurationFormatted(
		start_date,
		end_date,
		is_evergreen,
		campaign?.ui_status,
		// translators: Moment.js date format, `MMM` refers to short month name (e.g. `Sep`), `D` refers to day of month (e.g. `5`), `HH` refers to hours in 24-hour format (e.g. `19` in 19:50), `mm` refers to minutes (e.g. `50`). Wrap text [] to be displayed as is, for example `D [de] MMM` will be formatted as `5 de sep.`.
		_x( 'MMM D, HH:mm', 'shorter date format', 'jetpack-blaze' )
	);

	const durationFormatted = duration_days
		? sprintf(
				/* translators: %s is the duration in days */
				_n( '%s day', '%s days', duration_days, 'jetpack-blaze' ),
				formatNumber( duration_days, true )
			)
		: '';

	const initialRange =
		activeDays <= 7 ? ChartSourceDateRanges.WHOLE_CAMPAIGN : ChartSourceDateRanges.LAST_7_DAYS;
	const initialResolution = activeDays < 3 ? ChartResolution.Hour : ChartResolution.Day;

	const [ selectedDateRange, setSelectedDateRange ] =
		useState< ChartSourceDateRanges >( initialRange );

	const getChartStartDate = ( dateRange: ChartSourceDateRanges ) => {
		const effectiveEndDate = getEffectiveEndDate();
		let startDate = new Date( effectiveEndDate );

		switch ( dateRange ) {
			case ChartSourceDateRanges.YESTERDAY:
				startDate.setDate( effectiveEndDate.getDate() - 1 );
				break;
			case ChartSourceDateRanges.LAST_7_DAYS:
				startDate.setDate( effectiveEndDate.getDate() - 7 );
				break;
			case ChartSourceDateRanges.LAST_14_DAYS:
				startDate.setDate( effectiveEndDate.getDate() - 14 );
				break;
			case ChartSourceDateRanges.LAST_30_DAYS:
				startDate.setDate( effectiveEndDate.getDate() - 30 );
				break;
			case ChartSourceDateRanges.LAST_3_MONTHS:
				startDate.setDate( effectiveEndDate.getDate() - 92 );
				break;
			case ChartSourceDateRanges.LAST_6_MONTHS:
				startDate.setDate( effectiveEndDate.getDate() - 183 );
				break;
			case ChartSourceDateRanges.LAST_YEAR:
				startDate.setDate( effectiveEndDate.getDate() - 365 );
				break;

			case ChartSourceDateRanges.WHOLE_CAMPAIGN:
				if ( campaign?.start_date ) {
					startDate = new Date( campaign.start_date );
				}
				break;
		}

		return startDate.toISOString().split( 'T' )[ 0 ];
	};

	const [ chartParams, setChartParams ] = useState( {
		startDate: getChartStartDate( initialRange ),
		endDate: getEffectiveEndDate().toISOString().split( 'T' )[ 0 ],
		resolution: initialResolution,
	} );

	const updateChartParams = ( newDateRange: ChartSourceDateRanges ) => {
		// These shorter time frames can show hourly data, we can show up to 30 days of hourly data (max days stored in Druid)
		let newResolution: ChartResolution;

		switch ( newDateRange ) {
			case ChartSourceDateRanges.YESTERDAY:
			case ChartSourceDateRanges.LAST_7_DAYS:
				newResolution = ChartResolution.Hour;
				break;

			case ChartSourceDateRanges.LAST_30_DAYS:
				newResolution = ChartResolution.Day;
				break;

			case ChartSourceDateRanges.LAST_6_MONTHS:
			case ChartSourceDateRanges.LAST_3_MONTHS:
				newResolution = ChartResolution.Week;
				break;

			case ChartSourceDateRanges.LAST_YEAR:
				newResolution = ChartResolution.Month;
				break;

			case ChartSourceDateRanges.WHOLE_CAMPAIGN:
				if ( activeDays < 3 ) {
					newResolution = ChartResolution.Hour;
				} else if ( activeDays <= 30 ) {
					newResolution = ChartResolution.Day;
				} else if ( activeDays < 183 ) {
					newResolution = ChartResolution.Week;
				} else {
					newResolution = ChartResolution.Month;
				}
				break;

			default:
				newResolution = ChartResolution.Day;
				break;
		}

		const newStartDate = getChartStartDate( newDateRange );

		// Update the params for the chart here, which will trigger the refetch
		setChartParams( {
			startDate: newStartDate,
			endDate: getEffectiveEndDate().toISOString().split( 'T' )[ 0 ],
			resolution: newResolution,
		} );
		setSelectedDateRange( newDateRange );
	};

	const areStatsEnabled = useJetpackBlazeVersionCheck( siteId, '14.1', '0.5.3' );
	const hasStats = !! impressions_total && areStatsEnabled;

	const campaignStatsQuery = useCampaignChartStatsQuery(
		siteId,
		campaignId,
		chartParams,
		hasStats
	);
	const { isLoading: campaignsStatsIsLoading } = campaignStatsQuery;
	const { data: campaignStats } = campaignStatsQuery;
	const getCampaignStatsChart = (
		data: CampaignChartSeriesData[] | null,
		source: ChartSourceOptions,
		isLoading = false
	) => {
		if ( isLoading ) {
			return (
				<div className="campaign-item-details__graph-stats-loader">
					<Spinner />
				</div>
			);
		}

		// Data should be an array with at least 2 elements. The reason is the necessity to overcome
		// uPlot's bug of having an infinite loop https://github.com/leeoniya/uPlot/issues/827.
		if ( ! Array.isArray( data ) || data.length < 2 ) {
			return (
				<div>
					{ __(
						"We couldn't retrieve any data for this time frame. Please check back later, as campaign data may take a few hours to appear.",
						'jetpack-blaze'
					) }
				</div>
			);
		}

		return (
			<CampaignStatsLineChart
				data={ data }
				source={ source }
				resolution={ chartParams.resolution }
			/>
		);
	};

	const budgetRemainingFormatted =
		total_budget && total_budget_used !== undefined
			? `$${ formatCents( total_budget - total_budget_used, 2 ) }`
			: '';
	const overallSpendingFormatted = activeDays
		? `$${ formatCents( total_budget_used || 0, 2 ) }`
		: '- ';

	// Responsive WPCOM placements ship a renderable HTML doc — anything else
	// has no preview, just dimensions.
	const isWpcomHtmlFormat = [ 'html5_v2', 'html5_v3', 'html5_v4' ].includes( format || '' );

	const adPreviewLabel = isWpcomHtmlFormat ? (
		<div className="campaign-item-details__preview-header-preview-button">
			<AdPreviewModal templateFormat={ format || '' } htmlCode={ creative_html || '' } />
		</div>
	) : (
		<div className="campaign-item-details__preview-header-dimensions">
			<span>{ `${ width }x${ height }` }</span>
		</div>
	);

	const getDestinationLabel = () => {
		switch ( type ) {
			case 'post':
				return __( 'Post page', 'jetpack-blaze' );
			case 'page':
				return __( 'Page', 'jetpack-blaze' );
			case 'product':
				return __( 'Product page', 'jetpack-blaze' );
			default:
				return __( 'Post page', 'jetpack-blaze' );
		}
	};

	const icon = (
		<span className="campaign-item-details__support-buttons-icon">
			<svg
				width="16"
				height="17"
				viewBox="0 0 16 17"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M8 16.3193C12.4183 16.3193 16 12.7376 16 8.31934C16 3.90106 12.4183 0.319336 8 0.319336C3.58172 0.319336 0 3.90106 0 8.31934C0 12.7376 3.58172 16.3193 8 16.3193ZM13.375 11.9755C14.085 10.9338 14.5 9.67502 14.5 8.31934C14.5 7.08407 14.1554 5.92928 13.5571 4.94585L12.2953 5.75845C12.7428 6.50748 13 7.38337 13 8.31934C13 9.37572 12.6724 10.3556 12.1132 11.1629L13.375 11.9755ZM11.4245 13.8451L10.6121 12.5836C9.85194 13.0503 8.95739 13.3193 8 13.3193C7.04263 13.3193 6.1481 13.0503 5.38791 12.5836L4.57552 13.8451C5.56993 14.4627 6.74332 14.8193 8 14.8193C9.2567 14.8193 10.4301 14.4627 11.4245 13.8451ZM2.62498 11.9755C1.91504 10.9338 1.5 9.67503 1.5 8.31934C1.5 7.08405 1.84458 5.92926 2.44287 4.94582L3.70473 5.75842C3.25718 6.50745 3 7.38336 3 8.31934C3 9.37573 3.32761 10.3556 3.88678 11.1629L2.62498 11.9755ZM5.20588 4.17229C6.00361 3.63376 6.96508 3.31934 8 3.31934C9.03494 3.31934 9.99643 3.63377 10.7942 4.17232L11.6065 2.91084C10.5746 2.22134 9.33424 1.81934 8 1.81934C6.66578 1.81934 5.42544 2.22133 4.39351 2.91081L5.20588 4.17229ZM8 11.8193C9.933 11.8193 11.5 10.2523 11.5 8.31934C11.5 6.38634 9.933 4.81934 8 4.81934C6.067 4.81934 4.5 6.38634 4.5 8.31934C4.5 10.2523 6.067 11.8193 8 11.8193Z"
				/>
			</svg>
		</span>
	);

	const cancelCampaignButtonText =
		status === 'active'
			? __( 'Stop campaign', 'jetpack-blaze' )
			: __( 'Cancel campaign', 'jetpack-blaze' );
	const cancelCampaignConfirmButtonText =
		status === 'active' ? __( 'Yes, stop', 'jetpack-blaze' ) : __( 'Yes, cancel', 'jetpack-blaze' );
	const cancelCampaignTitle =
		status === 'active'
			? __( 'Stop the campaign', 'jetpack-blaze' )
			: __( 'Cancel the campaign', 'jetpack-blaze' );
	const cancelCampaignMessage =
		status === 'active'
			? __( 'If you continue, your campaign will immediately stop running.', 'jetpack-blaze' )
			: __(
					"If you continue, an approval request for your ad will be canceled, and the campaign won't start.",
					'jetpack-blaze'
				);

	const shouldShowStats =
		!! ui_status &&
		! [ campaignStatus.CREATED, campaignStatus.REJECTED, campaignStatus.SCHEDULED ].includes(
			ui_status
		);

	const campaignIsFinished =
		!! ui_status &&
		[ campaignStatus.CANCELED, campaignStatus.FINISHED, campaignStatus.SUSPENDED ].includes(
			ui_status
		);

	const chartControls = [];

	// Some controls are conditional, depending on how long the campaign has been active, or if the campaign is in the past
	// It would be pointless showing "yesterday" to a finished campaign, or 30 days to a 7-day campaign
	const conditionalControls = [
		{
			condition: ! campaignIsFinished,
			controls: [
				{
					onClick: () => updateChartParams( ChartSourceDateRanges.YESTERDAY ),
					title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.YESTERDAY ],
					isDisabled: selectedDateRange === ChartSourceDateRanges.YESTERDAY,
				},
			],
		},
		{
			condition: activeDays > 7,
			controls: [
				{
					onClick: () => updateChartParams( ChartSourceDateRanges.LAST_7_DAYS ),
					title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.LAST_7_DAYS ],
					isDisabled: selectedDateRange === ChartSourceDateRanges.LAST_7_DAYS,
				},
			],
		},
		{
			condition: activeDays > 14,
			controls: [
				{
					onClick: () => updateChartParams( ChartSourceDateRanges.LAST_14_DAYS ),
					title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.LAST_14_DAYS ],
					isDisabled: selectedDateRange === ChartSourceDateRanges.LAST_14_DAYS,
				},
			],
		},
		{
			condition: activeDays > 30,
			controls: [
				{
					onClick: () => updateChartParams( ChartSourceDateRanges.LAST_30_DAYS ),
					title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.LAST_30_DAYS ],
					isDisabled: selectedDateRange === ChartSourceDateRanges.LAST_30_DAYS,
				},
			],
		},
		{
			condition: activeDays > 92,
			controls: [
				{
					onClick: () => updateChartParams( ChartSourceDateRanges.LAST_3_MONTHS ),
					title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.LAST_3_MONTHS ],
					isDisabled: selectedDateRange === ChartSourceDateRanges.LAST_3_MONTHS,
				},
			],
		},
		{
			condition: activeDays > 183,
			controls: [
				{
					onClick: () => updateChartParams( ChartSourceDateRanges.LAST_6_MONTHS ),
					title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.LAST_6_MONTHS ],
					isDisabled: selectedDateRange === ChartSourceDateRanges.LAST_6_MONTHS,
				},
			],
		},
		{
			condition: activeDays > 365,
			controls: [
				{
					onClick: () => updateChartParams( ChartSourceDateRanges.LAST_YEAR ),
					title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.LAST_YEAR ],
					isDisabled: selectedDateRange === ChartSourceDateRanges.LAST_YEAR,
				},
			],
		},
	];

	// Add the available controls
	conditionalControls.forEach( ( { condition, controls } ) => {
		if ( condition ) {
			chartControls.push( ...controls );
		}
	} );

	// The controls that are always shown
	chartControls.push( {
		onClick: () => updateChartParams( ChartSourceDateRanges.WHOLE_CAMPAIGN ),
		title: ChartSourceDateRangeLabels[ ChartSourceDateRanges.WHOLE_CAMPAIGN ],
		isDisabled: selectedDateRange === ChartSourceDateRanges.WHOLE_CAMPAIGN,
	} );

	const onConfirmCancelCampaign = () => {
		setShowDeleteDialog( false );
		cancelCampaign( siteId ?? 0, campaignId ?? 0 );
	};

	const tspTargetRef = useRef< HTMLDivElement | null >( null );

	useEffect( () => {
		const handleScroll = () => {
			if ( tspTargetRef.current ) {
				const rect = tspTargetRef.current.getBoundingClientRect();
				const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
				if ( inView ) {
					window.removeEventListener( 'scroll', handleScroll );
					recordTracksEvent( 'calypso_dsp_tsp_section_scroll_into_view', {} );
				}
			}
		};

		// check that the page has loaded, before adding the listener
		// check if the campaign has stats, in this case wait for the campaigns stats loading to complete
		if ( ! isLoading && ( ! hasStats || ! campaignsStatsIsLoading ) ) {
			window.addEventListener( 'scroll', handleScroll );
			handleScroll();
		}

		return () => {
			window.removeEventListener( 'scroll', handleScroll );
		};
	}, [ isLoading, hasStats, campaignsStatsIsLoading ] );

	const cookies = parseCookie( document.cookie );

	const initialHideTspMetricsBanner = ( cookies[ HIDE_TSP_METRICS_BANNER_COOKIE ] ?? '0' ) === '1';
	const [ showTspMetricsBanner, setShowTspMetricsBanner ] = useState(
		! initialHideTspMetricsBanner
	);

	const closeTspMetricsBanner = () => {
		setShowTspMetricsBanner( false );
		setHideTspMetricsBannerCookie( true );
	};

	const getCampaignTSPStats = ( showBanner: boolean ) => (
		<>
			<div className="campaign-item-details__main-stats-row" ref={ tspTargetRef }>
				<TspMetricsBanner
					onClose={ closeTspMetricsBanner }
					display={ showBanner && showTspMetricsBanner }
				/>
				<div className="campaign-item-details__main-stats-title">
					<span className="campaign-item-details__title">
						{ __( 'Social Engagement', 'jetpack-blaze' ) }
					</span>
					<a
						href={ permalink }
						target="_blank"
						rel="noreferrer"
						className="campaign-item-details__tsp-permalink"
						onClick={ () => {
							recordTracksEvent( 'calypso_dsp_tsp_open_post_click', {} );
						} }
					>
						<span>{ __( 'Open Tumblr Post', 'jetpack-blaze' ) }</span>
						<Icon icon={ external } size={ 16 } />
					</a>
				</div>
				<div>
					<span className="campaign-item-details__label">
						{ __( 'Tumblr Post views', 'jetpack-blaze' ) }
					</span>
					<span className="campaign-item-details__text">
						<span className="wp-brand-font">
							{ ! isLoading ? tspImpressionsFormatted : <FlexibleSkeleton /> }
						</span>
					</span>
				</div>
				{ /* todo commenting this until we figure out if this is working properly*/ }
				{ /*<div>*/ }
				{ /*	<span className="campaign-item-details__label">*/ }
				{ /*		{ translate( 'Site visits from Tumblr Post' ) }*/ }
				{ /*	</span>*/ }
				{ /*	<span className="campaign-item-details__text">*/ }
				{ /*		<span className="wp-brand-font">*/ }
				{ /*			{ ! isLoading ? tspClicksFormatted : <FlexibleSkeleton /> }*/ }
				{ /*		</span>*/ }
				{ /*	</span>*/ }
				{ /*</div>*/ }
			</div>
			<div className="campaign-item-details__main-stats-row ">
				<div>
					<span className="campaign-item-details__label">
						{ __( 'Replies', 'jetpack-blaze' ) } &#42;
					</span>
					<span className="campaign-item-details__text">
						<span className="wp-brand-font">
							{ ! isLoading ? repliesFormatted : <FlexibleSkeleton /> }
						</span>
					</span>
				</div>
				<div>
					<span className="campaign-item-details__label">{ __( 'Likes', 'jetpack-blaze' ) }</span>
					<span className="campaign-item-details__text">
						<span className="wp-brand-font">
							{ ! isLoading ? likesFormatted : <FlexibleSkeleton /> }
						</span>
					</span>
				</div>
				{ displayedReplies && replies && replies?.length > 0 && (
					<div className="campaign-items-details__tsp-replies">
						{ displayedReplies.map( ( reply, index ) => (
							<div key={ index } className="campaign-items-details__tsp-reply">
								<a href={ reply.blog_url } target="_blank" rel="noopener noreferrer">
									@{ reply.blog_name }
								</a>
								<br />
								{ reply?.reply_text || '-' }
							</div>
						) ) }
						{ replies && replies?.length > 3 && (
							<Button
								variant="minimal"
								size="compact"
								className="campaign-items-details__replies-show-more-button"
								onClick={ () => {
									if ( ! showAllReplies ) {
										recordTracksEvent( 'calypso_dsp_tsp_section_replies_show_more_click', {} );
									}
									setShowAllReplies( ! showAllReplies );
								} }
							>
								{ showAllReplies
									? __( 'Show Less', 'jetpack-blaze' )
									: __( 'Show More', 'jetpack-blaze' ) }
							</Button>
						) }
					</div>
				) }

				<div className="campaign-items-details__reply-disclaimer">
					&#42;&nbsp;
					{ createInterpolateElement(
						__(
							'Some replies may have been hidden, blocked, or removed due to <tumblrGuideline>Tumblr guidelines <externalIcon/></tumblrGuideline> violation',
							'jetpack-blaze'
						),
						{
							tumblrGuideline: (
								<a
									href="https://www.tumblr.com/policy/en/user-guidelines"
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
							externalIcon: <Icon icon={ external } size={ 16 } />,
						}
					) }
				</div>
			</div>
		</>
	);

	return (
		<div className="campaign-item__container">
			<AlertDialog.Root
				open={ showDeleteDialog }
				onOpenChange={ open => {
					if ( ! open ) {
						setShowDeleteDialog( false );
					}
				} }
				onConfirm={ onConfirmCancelCampaign }
			>
				<AlertDialog.Popup
					className="campaign-item-details__cancel-dialog"
					intent="irreversible"
					title={ cancelCampaignTitle }
					description={ cancelCampaignMessage }
					cancelButtonText={ __( 'No', 'jetpack-blaze' ) }
					confirmButtonText={ cancelCampaignConfirmButtonText }
				/>
			</AlertDialog.Root>

			<SupportErrorDialog
				isOpen={ showErrorDialog }
				onClose={ () => setShowErrorDialog( false ) }
				title={ __( "Something's gone wrong", 'jetpack-blaze' ) }
			/>

			<SupportErrorDialog
				isOpen={ showReportErrorDialog }
				onClose={ () => setShowReportErrorDialog( false ) }
				title={ __( "Something's gone wrong trying to download your report", 'jetpack-blaze' ) }
			/>

			{ /* A back link in place of the Blaze title and subtitle. */ }
			<AdminPage
				className="promote-post-i2__page"
				ariaLabel={ __( 'Campaign details', 'jetpack-blaze' ) as string }
				unwrapped
				breadcrumbs={
					<Button
						className="campaign-item-details__go-back-button"
						onClick={ () =>
							page.show( getAdvertisingDashboardPath( `/campaigns/${ selectedSiteSlug }` ) )
						}
						variant="minimal"
						tone="neutral"
						size="compact"
					>
						<Icon icon={ chevronLeft } size={ 16 } />
						{ __( 'Go Back', 'jetpack-blaze' ) }
					</Button>
				}
				actions={
					! isLoading &&
					status && (
						<>
							{ canGetCampaignStats( status ) &&
								campaign?.campaign_stats?.impressions_total > 0 && (
									<CampaignDownloadStats
										siteId={ siteId }
										campaign={ campaign }
										isLoading={ isLoading }
										setStatsError={ () => setShowReportErrorDialog( true ) }
									/>
								) }
							{ canPromoteAgainCampaign( status ) && (
								<Button
									className="promote-again-button"
									disabled={ ! isLoadingBillingSummary && paymentBlocked }
									onClick={ onClickPromote }
								>
									{ __( 'Promote Again', 'jetpack-blaze' ) }
								</Button>
							) }
						</>
					)
				}
			>
				<header className="campaign-item-header">
					<div>
						<div className="campaign-item-details__header-title">
							{ isLoading ? <FlexibleSkeleton /> : campaignTitleFormatted }
						</div>

						<div className="campaign-item__header-status">
							{ ! isLoading && status ? (
								<Badge
									className="campaign-item__header-status-badge"
									intent={ getCampaignStatusBadgeIntent( ui_status ) }
								>
									{ getCampaignStatus( ui_status ) ?? '' }
								</Badge>
							) : (
								<div
									style={ {
										height: '20px',
									} }
								>
									<FlexibleSkeleton />
								</div>
							) }

							{ ! isLoading ? (
								<>
									<span>&bull;</span>
									<div className="campaign-item__header-status-item">
										{ __( 'Created:', 'jetpack-blaze' ) } { campaignCreatedFormatted }
									</div>
									{ ui_status === campaignStatus.SCHEDULED && start_date && (
										<>
											<span>&bull;</span>
											<div className="campaign-item__header-status-item">
												{ __( 'Starts:', 'jetpack-blaze' ) } { campaignStartFormatted }
											</div>
										</>
									) }
									<span>&bull;</span>
									<div className="campaign-item__header-status-item">
										{ __( 'Author:', 'jetpack-blaze' ) } { display_name }
									</div>
								</>
							) : (
								<FlexibleSkeleton />
							) }
						</div>
					</div>
				</header>
				<hr className="campaign-item-details-header-line" />
				<div className="campaign-item-details">
					{ status === 'rejected' && (
						<Notice.Root
							intent="error"
							className="promote-post-notice campaign-item-details__notice"
						>
							<Notice.Description>
								{ createInterpolateElement(
									__(
										'Your ad was not approved, please review our <wpcomTos>WordPress.com Terms</wpcomTos> and <advertisingTos>Advertising Policy</advertisingTos>.',
										'jetpack-blaze'
									),
									{
										wpcomTos: (
											<Link href={ localizeUrl( 'https://automattic.com/tos/' ) } openInNewTab />
										),
										advertisingTos: (
											<Link href="https://automattic.com/advertising-policy/" openInNewTab />
										),
									}
								) }
							</Notice.Description>
						</Notice.Root>
					) }

					{ status === 'suspended' && payment_links && payment_links.length > 0 && (
						<Notice.Root
							intent="error"
							className="promote-post-notice campaign-item-details__notice campaign-suspended"
						>
							<Notice.Description>
								{ __(
									'Your campaigns are suspended due to exceeding the credit limit. Please complete the payments using the provided links to resume your campaigns.',
									'jetpack-blaze'
								) }
							</Notice.Description>
						</Notice.Root>
					) }

					<section className="campaign-item-details__wrapper">
						<div className="campaign-item-details__main">
							{ status === 'suspended' && payment_links && payment_links.length > 0 && (
								<PaymentLinks payment_links={ payment_links } />
							) }

							{ shouldShowStats && (
								<div className="campaign-item-details__main-stats-container">
									<div className="campaign-item-details__main-stats campaign-item-details__impressions">
										{ !! duration_days && (
											<div className="campaign-item-details__main-stats-row ">
												<div>
													<span className="campaign-item-details__label">
														{ __( 'Duration', 'jetpack-blaze' ) }
													</span>
													<span className="campaign-item-details__text wp-brand-font">
														{ isLoading && <FlexibleSkeleton /> }
														{ ! isLoading && is_evergreen
															? __( 'Until stopped', 'jetpack-blaze' )
															: '' }
														{ ! isLoading && ! is_evergreen && durationFormatted }
													</span>
												</div>
												<div>
													<span className="campaign-item-details__label">
														{ __( 'Run between', 'jetpack-blaze' ) }
														&nbsp;
														<DetailsInfoPopover side="right">
															<span className="popover-title">
																{ ! isLoading ? (
																	durationDateAndTimeFormatted
																) : (
																	<FlexibleSkeleton />
																) }
															</span>
														</DetailsInfoPopover>
													</span>
													<span className="campaign-item-details__text wp-brand-font">
														{ ! isLoading ? durationDateFormatted : <FlexibleSkeleton /> }
													</span>
												</div>
											</div>
										) }
										<div className="campaign-item-details__main-stats-row ">
											<div className="campaign-item-details__main-stats-title">
												<span className="campaign-item-details__title">
													{ __( 'Ad Performance', 'jetpack-blaze' ) }
												</span>
											</div>
											<div>
												<span className="campaign-item-details__label">
													{ __( 'Clicks', 'jetpack-blaze' ) }
												</span>
												<span className="campaign-item-details__text">
													<span className="wp-brand-font">
														{ ! isLoading ? clicksFormatted : <FlexibleSkeleton /> }
													</span>
													{ !! clicksOutperformedPercentage && (
														<span className="campaign-item-details__outperformed">
															{ __( 'Outperformed', 'jetpack-blaze' ) }
														</span>
													) }
												</span>
												{ !! clicksOutperformedPercentage && (
													<span>
														{ sprintf(
															/* translators: %(percentage)s is the percentage. */ __(
																'%(percentage)s%% more than estimated',
																'jetpack-blaze'
															),
															{
																percentage: String( clicksOutperformedPercentage ),
															}
														) }
													</span>
												) }
											</div>
											<div>
												<span className="campaign-item-details__label">
													{ __( 'Ad views', 'jetpack-blaze' ) }
												</span>
												<span className="campaign-item-details__text">
													<span className="wp-brand-font">
														{ ! isLoading ? impressionsTotal : <FlexibleSkeleton /> }
													</span>
													{ !! impressionsOutperformedPercentage && (
														<span className="campaign-item-details__outperformed">
															{ __( 'Outperformed', 'jetpack-blaze' ) }
														</span>
													) }
												</span>
												{ !! impressionsOutperformedPercentage && (
													<span>
														{ sprintf(
															/* translators: %(percentage)s is the percentage. */ __(
																'%(percentage)s%% more than estimated',
																'jetpack-blaze'
															),
															{
																percentage: String( impressionsOutperformedPercentage ),
															}
														) }
													</span>
												) }
											</div>
											{ isWooStore && status !== 'created' && (
												<>
													<div>
														<span className="campaign-item-details__label">
															{ __( 'Conversion Value', 'jetpack-blaze' ) }
															<DetailsInfoPopover className="campaign-item-data__info-button">
																{ __( 'Conversion Value:', 'jetpack-blaze' ) }
																<br />
																<span className="popover-title">
																	{ __(
																		'assigns a monetary value associated with each conversion. Example: If each sale is worth $50, and you had 10 sales, your conversion value would be $500.',
																		'jetpack-blaze'
																	) }
																</span>
															</DetailsInfoPopover>
														</span>
														<span className="campaign-item-details__text wp-brand-font">
															{ ! isLoading ? conversionValueFormatted : <FlexibleSkeleton /> }
														</span>
													</div>
													<div>
														<span className="campaign-item-details__label">
															{ __( 'Conversions', 'jetpack-blaze' ) }
															<DetailsInfoPopover className="campaign-item-data__info-button">
																{ __( 'Conversions:', 'jetpack-blaze' ) }
																<br />
																<span className="popover-title">
																	{ __(
																		'show how many people made a purchase or completed a specific goal that aligns with the objectives of the campaign.',
																		'jetpack-blaze'
																	) }
																</span>
															</DetailsInfoPopover>
														</span>
														<span className="campaign-item-details__text wp-brand-font">
															{ ! isLoading ? conversionsTotalFormatted : <FlexibleSkeleton /> }
														</span>
													</div>
													<div>
														<span className="campaign-item-details__label">
															{ __( 'Conversion Rate', 'jetpack-blaze' ) }
															<DetailsInfoPopover className="campaign-item-data__info-button">
																{ __( 'Conversion Rate:', 'jetpack-blaze' ) }
																<br />
																<span className="popover-title">
																	{ __(
																		'shows the percentage of users who made a purchase (or completed a specific goal that aligns with the objectives of the campaign) out of the total number of users who clicked on the ad. Example: If your ad receives 100 clicks, and 5 people make a purchase, your conversion rate would be 5%.',
																		'jetpack-blaze'
																	) }
																</span>
															</DetailsInfoPopover>
														</span>
														<span className="campaign-item-details__text wp-brand-font">
															{ ! isLoading ? conversionsRateFormatted : <FlexibleSkeleton /> }
														</span>
													</div>
												</>
											) }
										</div>

										{ areStatsEnabled && (
											<>
												<div className="campaign-item-details__main-stats-row campaign-item-details__graph-stats-row">
													<div>
														<div className="campaign-item-page__graph">
															<DropdownMenu
																controls={ chartControls }
																icon={ chevronDown }
																text={ ChartSourceDateRangeLabels[ selectedDateRange ] }
																label={ ChartSourceDateRangeLabels[ selectedDateRange ] }
															/>
															<DropdownMenu
																controls={ [
																	{
																		onClick: () => setChartSource( ChartSourceOptions.Clicks ),
																		title: __( 'Clicks', 'jetpack-blaze' ),
																		isDisabled: chartSource === ChartSourceOptions.Clicks,
																	},
																	{
																		onClick: () => setChartSource( ChartSourceOptions.Impressions ),
																		title: __( 'Impressions', 'jetpack-blaze' ),
																		isDisabled: chartSource === ChartSourceOptions.Impressions,
																	},
																] }
																icon={ chevronDown }
																text={
																	chartSource === ChartSourceOptions.Clicks
																		? __( 'Clicks', 'jetpack-blaze' )
																		: __( 'Impressions', 'jetpack-blaze' )
																}
																label={ chartSource }
															/>
															{ getCampaignStatsChart(
																campaignStats?.series[ chartSource ] ?? null,
																chartSource,
																campaignsStatsIsLoading
															) }
														</div>
													</div>
												</div>

												{ campaignStats && (
													<div className="campaign-item-details__main-stats-row campaign-item-details__graph-stats-row">
														<div>
															<div className="campaign-item-page__locaton-charts">
																<span className="campaign-item-details__label">
																	{ chartSource === ChartSourceOptions.Clicks
																		? __( 'Clicks by location', 'jetpack-blaze' )
																		: __( 'Impressions by location', 'jetpack-blaze' ) }
																</span>
																<div>
																	<LocationChart
																		stats={ campaignStats?.total_stats.countryStats[ chartSource ] }
																		total={ campaignStats.total_stats.total[ chartSource ] }
																		source={ chartSource }
																	/>
																</div>
															</div>
														</div>
													</div>
												) }
											</>
										) }
										{ tsp && getCampaignTSPStats( true ) }
									</div>
								</div>
							) }

							<div className="campaign-item-details__main-stats-container">
								<div className="campaign-item-details__secondary-stats">
									<div className="campaign-item-details__secondary-stats-row">
										{ campaignIsFinished ? (
											<div>
												<span className="campaign-item-details__label">
													{ __( 'Overall spending', 'jetpack-blaze' ) }
												</span>
												<span className="campaign-item-details__text wp-brand-font">
													{ ! isLoading ? overallSpendingFormatted : <FlexibleSkeleton /> }
												</span>
											</div>
										) : (
											<>
												{ is_evergreen && ! shouldShowStats && (
													<div>
														<span className="campaign-item-details__label">
															{ __( 'Weekly budget', 'jetpack-blaze' ) }
														</span>
														<span className="campaign-item-details__text wp-brand-font">
															{ ! isLoading ? totalBudgetFormatted : <FlexibleSkeleton /> }
														</span>
														<span className="campaign-item-details__details">
															{ ! isLoading ? (
																sprintf(
																	/* translators: %s is the daily budget, e.g. $5.00 */
																	__( '%s per day', 'jetpack-blaze' ),
																	dailyBudgetFormatted
																)
															) : (
																<FlexibleSkeleton />
															) }
														</span>
													</div>
												) }
												{ is_evergreen && shouldShowStats && (
													<div>
														<span className="campaign-item-details__label">
															{ __( 'Weekly spend', 'jetpack-blaze' ) }
														</span>
														<span className="campaign-item-details__text wp-brand-font align-baseline">
															{ ! isLoading ? (
																<>
																	{ weeklySpendFormatted }{ ' ' }
																	<span className="campaign-item-details__details no-bottom-margin">
																		/ { totalBudgetFormatted }
																	</span>
																</>
															) : (
																<FlexibleSkeleton />
															) }
														</span>
														<span className="campaign-item-details__details">
															{ ! isLoading ? (
																`${ overallSpendingFormatted } ${ __( 'total', 'jetpack-blaze' ) }`
															) : (
																<FlexibleSkeleton />
															) }
														</span>
														{ weeklySpend > displayBudget && (
															<span className="campaign-item-details__details outperformed_notice">
																{ __(
																	'Your campaign outperformed this week! You’ll only be charged up to your budget.',
																	'jetpack-blaze'
																) }
															</span>
														) }
													</div>
												) }
												{ ! is_evergreen && (
													<div>
														<span className="campaign-item-details__label">
															{ __( 'Total Budget', 'jetpack-blaze' ) }
														</span>
														<span className="campaign-item-details__text wp-brand-font">
															{ ! isLoading ? totalBudgetFormatted : <FlexibleSkeleton /> }
														</span>
														{ budgetRemainingFormatted !== '' && (
															<span className="campaign-item-details__details">
																{ ! isLoading ? (
																	`${ budgetRemainingFormatted } remaining`
																) : (
																	<FlexibleSkeleton />
																) }
															</span>
														) }
													</div>
												) }
											</>
										) }
										<div>
											<span className="campaign-item-details__label">
												{ __( 'Cost-Per-Click', 'jetpack-blaze' ) }
											</span>
											<span className="campaign-item-details__text wp-brand-font">
												{ ! isLoading ? cpcFormatted : <FlexibleSkeleton /> }
											</span>
											<span className="campaign-item-details__details">
												{ ! isLoading ? (
													`${ ctrFormatted } ${ __( 'Click-through rate', 'jetpack-blaze' ) }`
												) : (
													<FlexibleSkeleton />
												) }
											</span>
										</div>
									</div>

									<div className="campaign-item-details__secondary-stats-interests-mobile">
										<>
											<span className="campaign-item-details__label">
												{ __( 'Interests', 'jetpack-blaze' ) }
											</span>
											<span className="campaign-item-details__details">
												{ ! isLoading ? topicsListFormatted : <FlexibleSkeleton /> }
											</span>
										</>
									</div>

									{ areStatsEnabled && campaign?.campaign_stats?.impressions_total > 0 && (
										<div className="campaign-item-details__main-stats-row campaign-item-details__graph-stats-row">
											<div>
												<div className="campaign-item-page__graph">
													{ getCampaignStatsChart(
														campaignStats?.series.spend ?? [],
														ChartSourceOptions.Spend,
														campaignsStatsIsLoading
													) }
												</div>
											</div>
										</div>
									) }
								</div>
							</div>

							{ ! shouldShowStats && tsp && (
								<div className="campaign-item-details__main-stats-container">
									{ getCampaignTSPStats( false ) }
								</div>
							) }

							<div className="campaign-item-details__main-stats-container">
								<div className="campaign-item-details__secondary-stats">
									<div className="campaign-item-details__secondary-stats-row">
										<div>
											<span className="campaign-item-details__label">
												{ __( 'Audience', 'jetpack-blaze' ) }
											</span>
											<span className="campaign-item-details__details">
												{ ! isLoading ? devicesListFormatted : <FlexibleSkeleton /> }
											</span>
										</div>
										<div>
											<span className="campaign-item-details__label">
												{ __( 'Languages', 'jetpack-blaze' ) }
											</span>
											<span className="campaign-item-details__details">
												{ ! isLoading ? languagesListFormatted : <FlexibleSkeleton /> }
											</span>
										</div>
										<div className="campaign-item-details-interests">
											<span className="campaign-item-details__label">
												{ __( 'Interests', 'jetpack-blaze' ) }
											</span>
											<span className="campaign-item-details__details">
												{ ! isLoading ? topicsListFormatted : <FlexibleSkeleton /> }
											</span>
										</div>
										<div>
											<span className="campaign-item-details__label">
												{ __( 'Location', 'jetpack-blaze' ) }
											</span>
											<span className="campaign-item-details__details campaign-item-details__locations">
												{ ! isLoading ? (
													<TargetLocations audienceList={ audience_list } />
												) : (
													<FlexibleSkeleton />
												) }
											</span>
										</div>
										<div className="campaign-item-details__destination">
											<span className="campaign-item-details__label">
												{ __( 'Destination', 'jetpack-blaze' ) }
											</span>
											<div className="campaign-item-details__ad-destination-url-container">
												{ ! isLoading ? (
													<Link
														className="campaign-item-details__ad-destination-url-link"
														href={ clickUrl }
														openInNewTab
													>
														{ getDestinationLabel() }
													</Link>
												) : (
													<FlexibleSkeleton />
												) }
											</div>
										</div>
									</div>
								</div>
							</div>

							{ canDisplayPaymentSection ? (
								<div className="campaign-item-details__payment-container">
									<div className="campaign-item-details__payment">
										<div className="campaign-item-details__payment-row ">
											{ orders && orders.length > 0 && (
												<div className="campaign-item-details__weekly-orders-row">
													<div className="campaign-item-details__weekly-label"></div>
													<div className="campaign-item-details__weekly-duration">
														<span className="campaign-item-details__label">
															{ __( 'Duration', 'jetpack-blaze' ) }
														</span>
													</div>
													<div className="campaign-item-details__weekly-amount">
														<span className="campaign-item-details__label">
															{ __( 'Amount', 'jetpack-blaze' ) }
														</span>
													</div>
												</div>
											) }
											{ orders && orders.length > 0
												? orders.map( ( order: Order, index: number ) => {
														const { lineItems, createdAt } = order;

														// Only sum the total of the line items that belong to the current
														// campaign (orders can have multiple campaigns)
														let campaignTotal = 0;
														lineItems.forEach( item => {
															if ( item.campaignId === campaignId ) {
																campaignTotal += +item.total;
															}
														} );

														// Format the total to display it
														const campaignTotalFormatted = formatCents( campaignTotal, 2 );

														// Format the date for display
														const formatDuration = ( createdAt: string ) => {
															const originalDate = moment( createdAt );

															// We only have the "created at" date stored, so we need to subtract a week to match the billing cycle
															let periodStart = originalDate.clone().subtract( 7, 'days' );

															if ( periodStart.isBefore( moment( start_date ) ) ) {
																periodStart = moment( start_date );
															}

															return `${ periodStart.format( 'MMM, D' ) } - ${ originalDate.format(
																'MMM, D'
															) }`;
														};

														const durationFormatted = formatDuration( createdAt );

														if ( order.status !== 'COMPLETED' ) {
															// we only want to display data when orders are in completed state
															return null;
														}

														return (
															<div
																key={ index }
																className="campaign-item-details__weekly-orders-row"
															>
																<div className="campaign-item-details__weekly-label">
																	{ is_evergreen
																		? __( 'Weekly spent', 'jetpack-blaze' )
																		: __( 'Weekly total', 'jetpack-blaze' ) }
																</div>
																<div className="campaign-item-details__weekly-duration">
																	{ durationFormatted }
																</div>
																<div className="campaign-item-details__weekly-amount">
																	${ campaignTotalFormatted }
																</div>
															</div>
														);
													} )
												: [] }
											{ orders && orders.length > 0 && (
												<div className="campaign-item-details__weekly-orders-row">
													<div className="campaign-item-details__weekly-orders-seperator"></div>
												</div>
											) }
											<div
												className={ clsx( 'campaign-item-details__secondary-payment-row', {
													'no-payment-method': ! payment_method || ! card_name,
												} ) }
											>
												{ payment_method && card_name && (
													<>
														<div className="campaign-item-details__payment-method">
															<span className="campaign-item-details__label">
																{ __( 'Payment method', 'jetpack-blaze' ) }
															</span>
															<span>{ card_name }</span>
															{ payment_method && <span>{ payment_method }</span> }
														</div>
														<hr className="campaign-item-details-footer-line" />
													</>
												) }
												<div className="campaign-item-details__total">
													{ credits ? (
														<span className="campaign-item-details__label">
															<div>{ __( 'Credits', 'jetpack-blaze' ) }</div>
															<div className="amount">{ creditsFormatted }</div>
														</span>
													) : (
														[]
													) }
													{ ! isNaN( total || 0 ) ? (
														<div>
															<span className="campaign-item-details__label">
																<div>{ __( 'Total', 'jetpack-blaze' ) }</div>
																<div className="amount">{ totalFormatted }</div>
															</span>
															<p className="campaign-item-details__payment-charges-disclosure">
																{ __( 'Promotional codes are not included.', 'jetpack-blaze' ) }
																<br />
																{ __( 'All charges inclusive of VAT, if any.', 'jetpack-blaze' ) }
															</p>
														</div>
													) : (
														[]
													) }
												</div>
											</div>
										</div>
									</div>
								</div>
							) : (
								[]
							) }
						</div>
						<div className="campaign-item-details__preview">
							<div className="campaign-item-details__preview-container">
								<div className="campaign-item-details__preview-header">
									<div className="campaign-item-details__preview-header-title">
										{ __( 'This ad is responsive', 'jetpack-blaze' ) }
									</div>
									<div className="campaign-item-details__preview-header-label">
										{ ! isLoading ? <>{ adPreviewLabel }</> : <FlexibleSkeleton /> }
									</div>
								</div>
								<AdPreview
									isLoading={ isLoading }
									htmlCode={ creative_html || '' }
									templateFormat={ format || '' }
									width={ isWpcomHtmlFormat ? '100%' : '300px' }
								/>
								<div className="campaign-item-details__preview-disclosure">
									{ getExternalTabletIcon() }
									<span className="preview-disclosure-text">
										{ __(
											'Depending on the platform, the ad may look different from the preview.',
											'jetpack-blaze'
										) }
									</span>
								</div>
							</div>

							<div className="campaign-item-details__support-buttons-container">
								<div className="campaign-item-details__support-articles-wrapper">
									<div className="campaign-item-details__support-heading">
										{ __( 'Support articles', 'jetpack-blaze' ) }
									</div>
									{ /*
								commented out until we get the link
								<Button className="is-link campaign-item-details__support-effective-ad-doc">
									{ translate( 'What makes an effective ad?' ) }
									{ getExternalLinkIcon() }
								</Button>*/ }

									<SupportLink>{ __( 'View documentation', 'jetpack-blaze' ) }</SupportLink>
								</div>

								<ButtonLink
									variant="outline"
									tone="neutral"
									className="contact-support-button"
									href={ localizeUrl( 'https://wordpress.com/help/contact' ) }
									openInNewTab
								>
									{ icon }
									{ __( 'Get support', 'jetpack-blaze' ) }
								</ButtonLink>

								{ ! isLoading && status && (
									<>
										{ canCancelCampaign( status ) && (
											<Button
												variant="outline"
												tone="neutral"
												className="cancel-campaign-button"
												onClick={ () => setShowDeleteDialog( true ) }
											>
												{ cancelCampaignButtonText }
											</Button>
										) }
									</>
								) }
							</div>
						</div>
					</section>
				</div>
			</AdminPage>
		</div>
	);
}
