import { LineChart, type SeriesData } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useViewportMatch } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Button, Icon, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { formatMetric, formatRate } from '../helpers/format-metric';
import RecentPosts, { type RecentPost } from '../recent-posts';
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

const DAYS_TO_SHOW = 30;

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
 * Convert the positional subscriber response into chart data.
 *
 * @param response - Subscriber Stats response.
 * @return Subscriber totals and series.
 */
function toSubscriberStats( response: SubscribersStatsResponse ): SubscriberStats {
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
				dateString: period,
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
 * Render the Newsletter Stats dashboard.
 *
 * @return Stats dashboard content.
 */
export default function SubscriberStatsChart(): JSX.Element {
	const isMobile = useViewportMatch( 'small', '<' );
	const metricDirection = isMobile ? 'row' : 'column';
	const metricJustify = isMobile ? 'space-between' : undefined;
	const date = new Date().toISOString().slice( 0, 10 );
	const subscribersPath = addQueryArgs( '/jetpack/v4/newsletter/stats/subscribers', {
		unit: 'day',
		quantity: DAYS_TO_SHOW,
		date,
		stat_fields: 'subscribers,subscribers_paid',
	} );
	const subscribersQuery = useQuery< SubscribersStatsResponse >( {
		queryKey: [ 'newsletter-stats', 'subscribers', subscribersPath ],
		queryFn: () => apiFetch( { path: subscribersPath } ),
	} );
	const recentPostsQuery = useQuery< RecentPostsResponse >( {
		queryKey: [ 'newsletter-stats', 'recent-posts' ],
		queryFn: () => apiFetch( { path: '/jetpack/v4/newsletter/stats/recent-posts' } ),
	} );
	const subscriberStats = subscribersQuery.data ? toSubscriberStats( subscribersQuery.data ) : null;
	const emailRates = toEmailRates( recentPostsQuery.data?.emailTotals );
	const { refetch: refetchSubscribers } = subscribersQuery;
	const retrySubscribers = useCallback( () => {
		refetchSubscribers();
	}, [ refetchSubscribers ] );

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
							x: { tickResolution: 'day' },
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
						<Stack
							direction="row"
							align="center"
							render={ <span /> }
							className="jetpack-newsletter-stats__metric-info"
							title={ __( 'Subscribers with a paid subscription.', 'jetpack-newsletter' ) }
						>
							<Icon icon={ info } size={ 18 } />
						</Stack>
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
				<Text render={ <h3 /> } variant="heading-lg">
					{ __( 'Subscribers', 'jetpack-newsletter' ) }
				</Text>
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
