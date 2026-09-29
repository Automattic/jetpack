import { LineChart, type SeriesData } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Button, Icon, Stack, Text, Tooltip } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { formatMetric, formatRate } from '../../../../_inc/subscribers/lib/format-metric';
import RecentPosts, { type RecentPost } from '../recent-posts';
import { recordStatsEvent, useStatsStateView } from '../stats-tracks';
import './style.scss';

type SubscribersStatsResponse = {
	fields?: string[];
	data?: Array< Array< string | number | null > >;
};

type EmailTotals = {
	sends: number;
	uniqueOpens: number;
	uniqueClicks: number;
};

type RecentPostsResponse = {
	posts: RecentPost[];
	emailTotals: EmailTotals | null;
	viewAllUrl: string;
	createPostUrl: string;
};

type SubscriberStats = {
	chartData: SeriesData[];
	totalSubscribers: number;
	paidSubscribers: number;
	openRate?: number;
	clickRate?: number;
};

type SubscriberPoint = {
	dateString: string;
	subscribers: number;
	paidSubscribers: number;
};

const STATS_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Bucket counts copied from the Stats subscribers chart: each choice sets both
 * the unit and how many of those units the x-axis covers.
 */
const CHART_UNITS = {
	day: 30,
	week: 12,
	month: 6,
	year: 3,
} as const;

type ChartUnit = keyof typeof CHART_UNITS;

/**
 * Normalize a numeric API value.
 *
 * @param value - API value.
 * @return A finite number.
 */
function toNumber( value: string | number | null | undefined ): number {
	const number = Number( value );
	return Number.isFinite( number ) ? number : 0;
}

/**
 * Calculate a bounded whole-number percentage.
 *
 * @param numerator   - Metric count.
 * @param denominator - Total count.
 * @return Percentage from 0 to 100.
 */
function ratePercent( numerator: number, denominator: number ): number {
	const percentage = Math.round( ( numerator / denominator ) * 100 );
	return Math.min( 100, Math.max( 0, percentage ) );
}

/**
 * Calculate aggregate engagement rates.
 *
 * @param totals - Totals from the recent-posts endpoint.
 * @return Available Open and Click rates.
 */
function toEmailRates(
	totals: EmailTotals | null | undefined
): Pick< SubscriberStats, 'openRate' | 'clickRate' > {
	if ( ! totals || totals.sends === 0 ) {
		return {};
	}

	return {
		openRate: ratePercent( totals.uniqueOpens, totals.sends ),
		clickRate: ratePercent( totals.uniqueClicks, totals.sends ),
	};
}

/**
 * Turn a Stats period label into a date the chart can parse.
 *
 * Week labels are `YWmWd` (`2026W09W21`). Year labels are the four-digit year.
 *
 * @param period - Period label from the subscribers response.
 * @param unit   - Selected chart unit.
 * @return A `yyyy-MM-dd` date string.
 */
function toChartDate( period: string, unit: ChartUnit ): string {
	if ( unit === 'week' ) {
		return period.replaceAll( 'W', '-' );
	}

	if ( unit === 'year' && /^\d{4}$/.test( period ) ) {
		return `${ period }-01-01`;
	}

	return period;
}

/**
 * Convert the positional subscriber response into chart data.
 *
 * @param response - Subscriber Stats response.
 * @param unit     - Selected chart unit.
 * @return Subscriber totals and series.
 */
function toSubscriberStats( response: SubscribersStatsResponse, unit: ChartUnit ): SubscriberStats {
	const periodIndex = response.fields?.indexOf( 'period' ) ?? -1;
	const subscribersIndex = response.fields?.indexOf( 'subscribers' ) ?? -1;
	const paidSubscribersIndex = response.fields?.indexOf( 'subscribers_paid' ) ?? -1;

	if ( periodIndex < 0 || subscribersIndex < 0 || ! Array.isArray( response.data ) ) {
		return { chartData: [], totalSubscribers: 0, paidSubscribers: 0 };
	}

	const points = response.data
		.map< SubscriberPoint | null >( row => {
			const period = row[ periodIndex ];
			if ( typeof period !== 'string' ) {
				return null;
			}

			return {
				dateString: toChartDate( period, unit ),
				subscribers: toNumber( row[ subscribersIndex ] ),
				paidSubscribers: paidSubscribersIndex >= 0 ? toNumber( row[ paidSubscribersIndex ] ) : 0,
			};
		} )
		.filter( ( point ): point is SubscriberPoint => point !== null )
		.reverse();

	if ( points.length === 0 ) {
		return { chartData: [], totalSubscribers: 0, paidSubscribers: 0 };
	}

	const latest = points[ points.length - 1 ];
	return {
		totalSubscribers: latest.subscribers,
		paidSubscribers: latest.paidSubscribers,
		chartData: [
			{
				label: __( 'Subscribers', 'jetpack-newsletter' ),
				data: points.map( point => ( {
					dateString: point.dateString,
					value: point.subscribers,
				} ) ),
				options: { stroke: '#3858e9' },
			},
			{
				label: __( 'Paid subscribers', 'jetpack-newsletter' ),
				data: points.map( point => ( {
					dateString: point.dateString,
					value: point.paidSubscribers,
				} ) ),
				options: { stroke: '#d67709' },
			},
		],
	};
}

/**
 * Build a welcome greeting for the current user, matching the Overview tab.
 *
 * @return Localized greeting.
 */
function getGreeting(): string {
	const displayName = getScriptData()?.user.current_user?.display_name ?? '';
	return displayName
		? sprintf(
				/* translators: %s: Current user's display name. */
				__( 'Welcome, %s', 'jetpack-newsletter' ),
				displayName
			)
		: __( 'Welcome', 'jetpack-newsletter' );
}

/**
 * Days, Weeks, Months, and Years control for the subscribers chart.
 *
 * @param props          - Control props.
 * @param props.unit     - Selected unit.
 * @param props.onChange - Called with the next unit.
 * @return Segmented unit control.
 */
function ChartUnitControl( {
	unit,
	onChange,
}: {
	unit: ChartUnit;
	onChange: ( unit: ChartUnit ) => void;
} ): JSX.Element {
	const handleChange = useCallback(
		( value?: string | number ) => {
			if ( value === 'day' || value === 'week' || value === 'month' || value === 'year' ) {
				onChange( value );
			}
		},
		[ onChange ]
	);

	return (
		<ToggleGroupControl
			className="jetpack-newsletter-stats__chart-unit"
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			isDeselectable={ false }
			label={ __( 'Chart interval', 'jetpack-newsletter' ) }
			value={ unit }
			onChange={ handleChange }
		>
			<ToggleGroupControlOption value="day" label={ __( 'Days', 'jetpack-newsletter' ) } />
			<ToggleGroupControlOption value="week" label={ __( 'Weeks', 'jetpack-newsletter' ) } />
			<ToggleGroupControlOption value="month" label={ __( 'Months', 'jetpack-newsletter' ) } />
			<ToggleGroupControlOption value="year" label={ __( 'Years', 'jetpack-newsletter' ) } />
		</ToggleGroupControl>
	);
}

/**
 * Paid-subscribers metric info control.
 *
 * @return Focusable info icon with a tooltip.
 */
function PaidSubscribersInfo(): JSX.Element {
	const description = __( 'Subscribers with a paid subscription.', 'jetpack-newsletter' );

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span
						className="jetpack-newsletter-stats__metric-info"
						tabIndex={ 0 }
						aria-label={ description }
					/>
				}
			>
				<Icon icon={ info } size={ 18 } />
			</Tooltip.Trigger>
			<Tooltip.Popup>{ description }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * Render the Newsletter Stats dashboard.
 *
 * @return Stats dashboard content.
 */
export default function SubscriberStatsChart(): JSX.Element {
	const isMobile = useViewportMatch( 'small', '<' );
	const metricDirection = isMobile ? 'row' : 'column';
	const metricJustify = isMobile ? 'space-between' : undefined;
	const [ unit, setUnit ] = useState< ChartUnit >( 'day' );
	const date = dateI18n( 'Y-m-d' );
	const subscribersPath = addQueryArgs( '/wpcom/v2/newsletter/stats/subscribers', {
		unit,
		quantity: CHART_UNITS[ unit ],
		date,
		stat_fields: 'subscribers,subscribers_paid',
	} );
	const subscribersQuery = useQuery< SubscribersStatsResponse >( {
		queryKey: [ 'newsletter-stats', 'subscribers', subscribersPath ],
		queryFn: () => apiFetch( { path: subscribersPath } ),
		staleTime: STATS_STALE_TIME_MS,
	} );
	const recentPostsQuery = useQuery< RecentPostsResponse >( {
		queryKey: [ 'newsletter-stats', 'recent-posts' ],
		queryFn: () => apiFetch( { path: '/wpcom/v2/newsletter/stats/recent-posts' } ),
		staleTime: STATS_STALE_TIME_MS,
	} );
	const subscriberStats = subscribersQuery.data
		? toSubscriberStats( subscribersQuery.data, unit )
		: null;
	const emailRates = toEmailRates( recentPostsQuery.data?.emailTotals );
	const { refetch: refetchSubscribers } = subscribersQuery;
	const retrySubscribers = useCallback( () => {
		recordStatsEvent( 'jetpack_newsletter_stats_retry_click', { area: 'subscribers' } );
		refetchSubscribers();
	}, [ refetchSubscribers ] );
	let subscribersState: 'empty' | 'error' | null = null;
	if ( subscribersQuery.isError ) {
		subscribersState = 'error';
	} else if ( subscriberStats && subscriberStats.chartData.length === 0 ) {
		subscribersState = 'empty';
	}
	useStatsStateView( 'subscribers', subscribersState );

	let chartContent: JSX.Element;
	if ( subscribersQuery.isError ) {
		chartContent = (
			<Stack
				direction="column"
				align="center"
				justify="center"
				gap="md"
				className="jetpack-newsletter-stats__state"
			>
				<Text render={ <p /> }>
					{ __( 'Subscriber stats could not be loaded.', 'jetpack-newsletter' ) }
				</Text>
				<Button onClick={ retrySubscribers }>{ __( 'Retry', 'jetpack-newsletter' ) }</Button>
			</Stack>
		);
	} else if ( subscriberStats === null ) {
		chartContent = (
			<Stack
				direction="column"
				align="center"
				justify="center"
				className="jetpack-newsletter-stats__state"
			>
				{ __( 'Loading subscriber stats…', 'jetpack-newsletter' ) }
			</Stack>
		);
	} else if ( subscriberStats.chartData.length === 0 ) {
		chartContent = (
			<Stack
				direction="column"
				align="center"
				justify="center"
				className="jetpack-newsletter-stats__state"
			>
				{ __( 'No subscriber data is available for this period.', 'jetpack-newsletter' ) }
			</Stack>
		);
	} else {
		chartContent = (
			<div className="jetpack-newsletter-stats__chart">
				<LineChart
					data={ subscriberStats.chartData }
					height={ 420 }
					curveType="linear"
					withGradientFill
					withTooltips
					showLegend={ false }
					gridVisibility="y"
					options={ {
						yScale: { type: 'linear', zero: true },
						axis: {
							y: { orientation: 'right' },
							x: { tickResolution: unit },
						},
					} }
				/>
			</div>
		);
	}

	return (
		<Stack className="jetpack-newsletter-stats" direction="column" gap="2xl" align="stretch">
			<Text render={ <h2 /> } variant="heading-2xl" className="jetpack-newsletter-stats__greeting">
				{ getGreeting() }
			</Text>

			<Stack
				direction="row"
				wrap="wrap"
				className="jetpack-newsletter-stats__metrics"
				aria-label={ __( 'Newsletter metrics', 'jetpack-newsletter' ) }
				render={ <section /> }
			>
				<Stack
					direction={ metricDirection }
					justify={ metricJustify }
					gap="lg"
					className="jetpack-newsletter-stats__metric"
				>
					<Stack
						direction="row"
						align="center"
						gap="sm"
						render={ <span /> }
						className="jetpack-newsletter-stats__metric-label"
					>
						{ __( 'Total subscribers', 'jetpack-newsletter' ) }
					</Stack>
					<strong className="jetpack-newsletter-stats__metric-value">
						{ formatMetric( subscriberStats?.totalSubscribers ) }
					</strong>
				</Stack>
				<Stack
					direction={ metricDirection }
					justify={ metricJustify }
					gap="lg"
					className="jetpack-newsletter-stats__metric"
				>
					<Stack
						direction="row"
						align="center"
						gap="sm"
						render={ <span /> }
						className="jetpack-newsletter-stats__metric-label"
					>
						{ __( 'Open rate (last 30 sends)', 'jetpack-newsletter' ) }
					</Stack>
					<strong className="jetpack-newsletter-stats__metric-value">
						{ formatRate( emailRates.openRate ) }
					</strong>
				</Stack>
				<Stack
					direction={ metricDirection }
					justify={ metricJustify }
					gap="lg"
					className="jetpack-newsletter-stats__metric"
				>
					<Stack
						direction="row"
						align="center"
						gap="sm"
						render={ <span /> }
						className="jetpack-newsletter-stats__metric-label"
					>
						{ __( 'Click rate (last 30 sends)', 'jetpack-newsletter' ) }
					</Stack>
					<strong className="jetpack-newsletter-stats__metric-value">
						{ formatRate( emailRates.clickRate ) }
					</strong>
				</Stack>
				<Stack
					direction={ metricDirection }
					justify={ metricJustify }
					gap="lg"
					className="jetpack-newsletter-stats__metric"
				>
					<Stack
						direction="row"
						align="center"
						gap="sm"
						render={ <span /> }
						className="jetpack-newsletter-stats__metric-label"
					>
						{ __( 'Paid subscribers', 'jetpack-newsletter' ) }
						<PaidSubscribersInfo />
					</Stack>
					<strong className="jetpack-newsletter-stats__metric-value">
						{ formatMetric( subscriberStats?.paidSubscribers ) }
					</strong>
				</Stack>
			</Stack>

			<Stack
				direction="column"
				gap="xl"
				className="jetpack-newsletter-stats__chart-card"
				render={ <section /> }
			>
				<Stack
					className="jetpack-newsletter-stats__chart-heading"
					direction="row"
					justify="space-between"
					align="center"
					gap="md"
					wrap="wrap"
				>
					<Text render={ <h3 /> } variant="heading-lg">
						{ __( 'Subscribers', 'jetpack-newsletter' ) }
					</Text>
					<ChartUnitControl unit={ unit } onChange={ setUnit } />
				</Stack>
				{ chartContent }
			</Stack>

			<RecentPosts
				posts={ recentPostsQuery.data?.posts ?? [] }
				viewAllUrl={ recentPostsQuery.data?.viewAllUrl ?? '' }
				createPostUrl={ recentPostsQuery.data?.createPostUrl ?? '' }
				isLoading={ recentPostsQuery.isLoading }
				isError={ recentPostsQuery.isError }
				onRetry={ recentPostsQuery.refetch }
			/>
		</Stack>
	);
}
