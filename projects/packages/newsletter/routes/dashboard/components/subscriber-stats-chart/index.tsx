import { LineChart, type SeriesData } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScriptData } from '@automattic/jetpack-script-data';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useViewportMatch } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { arrowLeft, arrowRight, info } from '@wordpress/icons';
import { Button, Icon, Stack, Text, Tooltip } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import clsx from 'clsx';
import { formatMetric, formatRate } from '../../../../_inc/subscribers/lib/format-metric';
import RecentPosts, { type RecentPost } from '../recent-posts';
import { recordStatsEvent, useStatsStateView } from '../stats-tracks';
import type { JSX, MouseEvent } from 'react';
import './style.scss';

type SubscribersStatsResponse = {
	unit?: string;
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

type SubscriberStats = {
	chartData: SeriesData[];
	totalSubscribers: number | null;
	paidSubscribers: number | null;
	unit: ChartUnit;
	openRate?: number;
	clickRate?: number;
};

type SubscriberPoint = {
	dateString: string;
	subscribers: number | null;
	paidSubscribers: number | null;
};

const STATS_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * A missing subscriber total is a gap in the series, not zero.
 *
 * @param value - API value.
 * @return The count, or null when the period has none.
 */
function toCount( value: string | number | null | undefined ): number | null {
	if ( value === null || value === undefined ) {
		return null;
	}

	const number = Number( value );
	return Number.isFinite( number ) ? number : null;
}

/**
 * Use the unit the response was bucketed with. The toggle can move before that
 * response arrives, and a week label parsed as another unit is not a date.
 *
 * @param unit     - `unit` field on the subscribers response.
 * @param fallback - Interval selected in the chart control.
 * @return Chart interval.
 */
function chartUnit( unit: string | undefined, fallback: ChartUnit ): ChartUnit {
	if ( unit === 'day' || unit === 'week' || unit === 'month' || unit === 'year' ) {
		return unit;
	}

	return fallback;
}

/**
 * Move the chart end date by one full window.
 *
 * Weeks step by seven days per bucket. Months and years end on the last day of that period.
 *
 * @param isoDate   - Current end date, `yyyy-MM-dd`.
 * @param unit      - Selected chart unit.
 * @param direction - `-1` for the previous window, `1` for the next.
 * @return Shifted `yyyy-MM-dd` date.
 */
function shiftChartDate( isoDate: string, unit: ChartUnit, direction: -1 | 1 ): string {
	const [ year, month, day ] = isoDate.split( '-' ).map( Number );
	const steps = CHART_UNITS[ unit ] * direction;
	const startDay = unit === 'month' || unit === 'year' ? 1 : day;
	const next = new Date( year, month - 1, startDay );

	if ( unit === 'month' ) {
		next.setMonth( next.getMonth() + steps );
		next.setMonth( next.getMonth() + 1, 0 );
	} else if ( unit === 'year' ) {
		next.setFullYear( next.getFullYear() + steps );
		next.setMonth( 11, 31 );
	} else if ( unit === 'week' ) {
		next.setDate( next.getDate() + steps * 7 );
	} else {
		next.setDate( next.getDate() + steps );
	}

	const shiftedMonth = String( next.getMonth() + 1 ).padStart( 2, '0' );
	const shiftedDay = String( next.getDate() ).padStart( 2, '0' );
	return `${ next.getFullYear() }-${ shiftedMonth }-${ shiftedDay }`;
}

/**
 * Keep a shifted end date from passing today.
 *
 * @param shifted - Candidate end date, `yyyy-MM-dd`.
 * @param today   - Site calendar day, `yyyy-MM-dd`.
 * @return End date to request.
 */
function clampChartEndDate( shifted: string, today: string ): string {
	return shifted < today ? shifted : today;
}

/**
 * UTC calendar day.
 *
 * The live subscriber total is used only when the requested day is gmdate( 'Y-m-d' ).
 *
 * @return `yyyy-MM-dd` in UTC.
 */
function utcToday(): string {
	return new Date().toISOString().slice( 0, 10 );
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
 * @param response     - Subscriber Stats response.
 * @param fallbackUnit - Interval selected in the chart control.
 * @return Subscriber totals and series.
 */
function toSubscriberStats(
	response: SubscribersStatsResponse,
	fallbackUnit: ChartUnit
): SubscriberStats {
	const unit = chartUnit( response.unit, fallbackUnit );
	const periodIndex = response.fields?.indexOf( 'period' ) ?? -1;
	const subscribersIndex = response.fields?.indexOf( 'subscribers' ) ?? -1;
	const paidSubscribersIndex = response.fields?.indexOf( 'subscribers_paid' ) ?? -1;

	if ( periodIndex < 0 || subscribersIndex < 0 || ! Array.isArray( response.data ) ) {
		return { chartData: [], totalSubscribers: 0, paidSubscribers: 0, unit };
	}

	const points = response.data
		.map< SubscriberPoint | null >( row => {
			const period = row[ periodIndex ];
			if ( typeof period !== 'string' ) {
				return null;
			}

			return {
				dateString: toChartDate( period, unit ),
				subscribers: toCount( row[ subscribersIndex ] ),
				paidSubscribers: paidSubscribersIndex >= 0 ? toCount( row[ paidSubscribersIndex ] ) : 0,
			};
		} )
		.filter( ( point ): point is SubscriberPoint => point !== null )
		.reverse();

	if ( points.length === 0 ) {
		return { chartData: [], totalSubscribers: 0, paidSubscribers: 0, unit };
	}

	const latest = points[ points.length - 1 ];
	return {
		unit,
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

const CHART_UNIT_OPTIONS: Array< { value: ChartUnit; label: string } > = [
	{ value: 'day', label: __( 'Days', 'jetpack-newsletter' ) },
	{ value: 'week', label: __( 'Weeks', 'jetpack-newsletter' ) },
	{ value: 'month', label: __( 'Months', 'jetpack-newsletter' ) },
	{ value: 'year', label: __( 'Years', 'jetpack-newsletter' ) },
];

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
		( event: MouseEvent< HTMLButtonElement > ) => {
			const value = event.currentTarget.value;
			if ( value !== 'day' && value !== 'week' && value !== 'month' && value !== 'year' ) {
				return;
			}

			if ( value === unit ) {
				return;
			}

			recordStatsEvent( 'jetpack_newsletter_stats_interval_click', { interval: value } );
			onChange( value );
		},
		[ onChange, unit ]
	);

	return (
		<div
			className="jetpack-newsletter-stats__chart-unit"
			role="group"
			aria-label={ __( 'Chart interval', 'jetpack-newsletter' ) }
		>
			{ CHART_UNIT_OPTIONS.map( option => (
				<button
					key={ option.value }
					className="jetpack-newsletter-stats__interval"
					type="button"
					aria-pressed={ unit === option.value }
					value={ option.value }
					onClick={ handleChange }
				>
					{ option.label }
				</button>
			) ) }
		</div>
	);
}

/**
 * Arrows that page the chart end date by one window.
 *
 * @param props             - Control props.
 * @param props.disableNext - Whether the next window would pass today.
 * @param props.onPrevious  - Move one window earlier.
 * @param props.onNext      - Move one window later.
 * @return Previous and next controls.
 */
function ChartRangeArrows( {
	disableNext,
	onPrevious,
	onNext,
}: {
	disableNext: boolean;
	onPrevious: () => void;
	onNext: () => void;
} ): JSX.Element {
	return (
		<div className="jetpack-newsletter-stats__chart-arrows">
			<button
				className="jetpack-newsletter-stats__chart-arrow"
				type="button"
				aria-label={ __( 'Previous period', 'jetpack-newsletter' ) }
				onClick={ onPrevious }
			>
				<Icon icon={ arrowLeft } size={ 24 } />
			</button>
			<button
				className="jetpack-newsletter-stats__chart-arrow"
				type="button"
				aria-label={ __( 'Next period', 'jetpack-newsletter' ) }
				onClick={ onNext }
				disabled={ disableNext }
			>
				<Icon icon={ arrowRight } size={ 24 } />
			</button>
		</div>
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
	const today = dateI18n( 'Y-m-d' );
	const [ unit, setUnit ] = useState< ChartUnit >( 'day' );
	const [ endDate, setEndDate ] = useState( today );
	const subscribersPath = addQueryArgs( '/wpcom/v2/newsletter/stats/subscribers', {
		unit,
		quantity: CHART_UNITS[ unit ],
		date: endDate,
		stat_fields: 'subscribers,subscribers_paid',
	} );
	const subscribersQuery = useQuery< SubscribersStatsResponse >( {
		queryKey: [ 'newsletter-stats', 'subscribers', subscribersPath ],
		queryFn: () => apiFetch( { path: subscribersPath } ),
		placeholderData: keepPreviousData,
		staleTime: STATS_STALE_TIME_MS,
	} );
	// The headline is the live count, so the chart window cannot change it.
	const currentTotalsPath = addQueryArgs( '/wpcom/v2/newsletter/stats/subscribers', {
		unit: 'day',
		quantity: 1,
		date: utcToday(),
		stat_fields: 'subscribers,subscribers_paid',
	} );
	const currentTotalsQuery = useQuery< SubscribersStatsResponse >( {
		queryKey: [ 'newsletter-stats', 'subscribers', 'current', currentTotalsPath ],
		queryFn: () => apiFetch( { path: currentTotalsPath } ),
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
	const currentTotals = currentTotalsQuery.data
		? toSubscriberStats( currentTotalsQuery.data, 'day' )
		: null;
	const showPreviousChart = subscribersQuery.isPlaceholderData;
	const moveChartDate = useCallback(
		( direction: -1 | 1 ) => {
			setEndDate( current =>
				clampChartEndDate( shiftChartDate( current, unit, direction ), today )
			);
			recordStatsEvent( 'jetpack_newsletter_stats_period_click', {
				direction: direction === -1 ? 'previous' : 'next',
				interval: unit,
			} );
		},
		[ today, unit ]
	);
	const changeChartUnit = useCallback(
		( nextUnit: ChartUnit ) => {
			setUnit( nextUnit );
			setEndDate( today );
		},
		[ today ]
	);
	const showPreviousPeriod = useCallback( () => moveChartDate( -1 ), [ moveChartDate ] );
	const showNextPeriod = useCallback( () => moveChartDate( 1 ), [ moveChartDate ] );
	const emailRates = toEmailRates( recentPostsQuery.data?.emailTotals );
	const { refetch: refetchSubscribers } = subscribersQuery;
	const { refetch: refetchCurrentTotals } = currentTotalsQuery;
	const retrySubscribers = useCallback( () => {
		recordStatsEvent( 'jetpack_newsletter_stats_retry_click', { area: 'subscribers' } );
		refetchSubscribers();
		refetchCurrentTotals();
	}, [ refetchCurrentTotals, refetchSubscribers ] );
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
			<div
				className={ clsx( 'jetpack-newsletter-stats__chart', {
					'is-loading': showPreviousChart,
				} ) }
				aria-busy={ showPreviousChart }
				data-testid="subscriber-chart-panel"
			>
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
							x: { tickResolution: subscriberStats.unit },
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
						{ formatMetric( currentTotals?.totalSubscribers ) }
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
						{ formatMetric( currentTotals?.paidSubscribers ) }
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
					<div className="jetpack-newsletter-stats__chart-controls">
						<ChartRangeArrows
							disableNext={ endDate >= today }
							onPrevious={ showPreviousPeriod }
							onNext={ showNextPeriod }
						/>
						<ChartUnitControl unit={ unit } onChange={ changeChartUnit } />
					</div>
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
