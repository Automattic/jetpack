import { BarChart, GlobalChartsProvider, Legend } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { formatNumber } from '@automattic/number-formatters';
import { Spinner } from '@wordpress/components';
import { dateI18n, getDate } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight, desktop, mobile, Icon } from '@wordpress/icons';
import { Button, Card, Notice } from '@wordpress/ui';
import { useState } from 'react';
import { bucketHistoryDays, getHistoryWindow } from './lib/history-days';
import { getScoreTier, getScoreTierLabel, getScoreTierColor } from './lib/score-utils';
import { usePerformanceHistory } from './lib/use-performance-history';
import UpgradeCTA from './upgrade-cta';
import './history-chart-card.scss';
import type { PerformanceHistoryData } from './lib/use-performance-history';
import type { SeriesData } from '@automattic/charts';

type DeviceColors = { desktop?: string; mobile?: string };
type History = PerformanceHistoryData;
type Props = {
	data?: PerformanceHistoryData | null;
	isLoading?: boolean;
	isVisible?: boolean;
	isError?: boolean;
	error?: Error | null;
	onRetry: () => void;
	needsUpgrade?: boolean;
	isFreshStart?: boolean;
	onDismissFreshStart: () => void;
};

const emptyColor = 'var(--wpds-color-stroke-surface-neutral-weak)';
const tiers = [ 'good', 'medium', 'poor' ] as const;

export function buildHistorySeries(
	data: PerformanceHistoryData | null | undefined,
	window = getHistoryWindow( 0 )
): SeriesData[] {
	const days = bucketHistoryDays( data?.periods ?? [], window );
	return ( [ 'desktop', 'mobile' ] as const ).map( device => ( {
		label:
			device === 'desktop' ? __( 'Desktop', 'jetpack-boost' ) : __( 'Mobile', 'jetpack-boost' ),
		data: days.map( day => ( {
			label: day.date,
			value: day.period?.dimensions[ `${ device }_overall_score` ] ?? 0,
			color: day.period
				? getScoreTierColor( getScoreTier( day.period.dimensions[ `${ device }_overall_score` ] ) )
				: emptyColor,
		} ) ),
	} ) );
}

export function EmptyDayTooltip( { date }: { date: string } ) {
	return (
		<div className="jetpack-boost-overview__history-tooltip">
			<div className="jetpack-boost-overview__tooltip-date">
				{ dateI18n( 'F j, Y', getDate( `${ date }T12:00:00` ), false ) }
			</div>
			{ __( 'No score recorded before you unlocked this feature.', 'jetpack-boost' ) }
		</div>
	);
}

export function HistoryTooltip( {
	period,
	colors,
}: {
	period: History[ 'periods' ][ number ];
	colors?: DeviceColors;
} ) {
	const dimensions = period.dimensions;
	const content = (
		<>
			<div className="jetpack-boost-overview__tooltip-date">
				{ dateI18n( 'F j, Y', new Date( period.timestamp ), false ) }
			</div>
			<dl>
				<div className="jetpack-boost-overview__tooltip-section">
					<dt>{ __( 'Overall score', 'jetpack-boost' ) }</dt>
					<dd>
						{ getScoreLetter( dimensions.mobile_overall_score, dimensions.desktop_overall_score ) }
					</dd>
				</div>
				{ ( [ 'desktop', 'mobile' ] as const ).map( device => (
					<div key={ device } className="jetpack-boost-overview__tooltip-section">
						<dt>
							<span
								className="jetpack-boost-overview__series-swatch"
								style={ {
									backgroundColor:
										colors?.[ device ] ??
										getScoreTierColor( getScoreTier( dimensions[ `${ device }_overall_score` ] ) ),
								} }
								aria-hidden="true"
							/>
							{ device === 'desktop'
								? __( 'Desktop score', 'jetpack-boost' )
								: __( 'Mobile score', 'jetpack-boost' ) }
						</dt>
						<dd>
							{ sprintf(
								/* translators: %d is the performance score. */
								__( '%d / 100', 'jetpack-boost' ),
								dimensions[ `${ device }_overall_score` ]
							) }
						</dd>
						<dt>{ __( 'Largest Contentful Paint', 'jetpack-boost' ) }</dt>
						<dd>
							{ sprintf(
								/* translators: %s is a duration in seconds. */
								__( '%ss', 'jetpack-boost' ),
								formatNumber( dimensions[ `${ device }_lcp` ], { decimals: 2 } )
							) }
						</dd>
						<dt>{ __( 'Total Blocking Time', 'jetpack-boost' ) }</dt>
						<dd>
							{ sprintf(
								/* translators: %s is a duration in seconds. */
								__( '%ss', 'jetpack-boost' ),
								formatNumber( dimensions[ `${ device }_tbt` ], { decimals: 2 } )
							) }
						</dd>
						<dt>{ __( 'Cumulative Layout Shift', 'jetpack-boost' ) }</dt>
						<dd>{ formatNumber( dimensions[ `${ device }_cls` ], { decimals: 2 } ) }</dd>
					</div>
				) ) }
			</dl>
		</>
	);
	return <div className="jetpack-boost-overview__history-tooltip">{ content }</div>;
}

export default function HistoryChartCard( {
	data: currentData,
	isLoading: currentLoading,
	isVisible = true,
	isError: currentError,
	error: currentErrorDetail,
	onRetry: retryCurrent,
	needsUpgrade,
	isFreshStart,
	onDismissFreshStart,
}: Props ) {
	const [ offset, setOffset ] = useState( 0 );
	const window = getHistoryWindow( offset );
	const history = usePerformanceHistory( offset > 0 && isVisible && ! needsUpgrade, window );
	const data = offset === 0 ? currentData : history.data;
	const isLoading = offset === 0 ? currentLoading : history.isPending;
	const isError = offset === 0 ? currentError : history.isError;
	const error = offset === 0 ? currentErrorDetail : history.error;
	const onRetry = offset === 0 ? retryCurrent : () => history.refetch();
	const series = buildHistorySeries( data, window );
	const days = bucketHistoryDays( data?.periods ?? [], window );
	const [ chartKeys, setChartKeys ] = useState( [ 0, 0 ] );
	let content;
	if ( isLoading && ! data?.periods.length ) {
		content = (
			<div className="jetpack-boost-overview__chart-loading">
				<Spinner />
			</div>
		);
	} else if ( isError && ! isLoading ) {
		content = (
			<Notice.Root
				intent="error"
				spokenMessage={ __( 'Failed to load performance history', 'jetpack-boost' ) }
			>
				<Notice.Title>{ __( 'Failed to load performance history', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>{ error?.message }</Notice.Description>
				<Notice.Actions>
					<Button onClick={ onRetry }>{ __( 'Try again', 'jetpack-boost' ) }</Button>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( needsUpgrade ) {
		content = (
			<Notice.Root
				intent="info"
				spokenMessage={ __( 'Unlock historical performance', 'jetpack-boost' ) }
			>
				<Notice.Title>{ __( 'Unlock historical performance', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>
					{ __( 'Upgrade and learn more about your site performance over time.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<UpgradeCTA />
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( isFreshStart ) {
		content = (
			<Notice.Root
				intent="success"
				spokenMessage={ __( 'Your scores will be recorded from now on.', 'jetpack-boost' ) }
			>
				<Notice.Title>
					{ __( 'Hello there! Jetpack Boost premium has been activated.', 'jetpack-boost' ) }
				</Notice.Title>
				<Notice.Description>
					{ __( 'Your scores will be recorded from now on.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<Button onClick={ onDismissFreshStart }>
						{ __( 'Okay, got it!', 'jetpack-boost' ) }
					</Button>
				</Notice.Actions>
			</Notice.Root>
		);
	} else {
		content = (
			<GlobalChartsProvider>
				<div className="boost-daily-history">
					{ series.map( ( deviceSeries, index ) => (
						<section
							key={ deviceSeries.label }
							aria-label={
								index === 0
									? __( 'Desktop score history', 'jetpack-boost' )
									: __( 'Mobile score history', 'jetpack-boost' )
							}
						>
							<h3 className="boost-daily-history__device">
								<Icon icon={ index === 0 ? desktop : mobile } />
								{ deviceSeries.label }
							</h3>
							<div
								className="boost-daily-history__plot"
								onBlur={ event => {
									if ( ! event.currentTarget.contains( event.relatedTarget as Node | null ) )
										setChartKeys( keys =>
											keys.map( ( key, chartIndex ) => ( chartIndex === index ? key + 1 : key ) )
										);
								} }
							>
								{ isVisible && (
									<BarChart
										key={ `${ offset }-${ chartKeys[ index ] }` }
										data={ [ deviceSeries ] }
										withTooltips
										gridVisibility="none"
										options={ {
											yScale: { domain: [ 0, 100 ], nice: false, zero: true },
											axis: {
												y: { tickValues: [ 0, 50, 100 ] },
												x: {
													tickValues: [ days[ 0 ].date, days[ 14 ].date, days[ 29 ].date ],
													tickFormat: value =>
														dateI18n( 'M j', getDate( `${ value }T12:00:00` ), false ),
												},
											},
										} }
										renderTooltip={ ( { tooltipData } ) => {
											const day = days.find(
												slot => slot.date === tooltipData?.nearestDatum?.datum.label
											);
											return day?.period ? (
												<HistoryTooltip period={ day.period } />
											) : day ? (
												<EmptyDayTooltip date={ day.date } />
											) : null;
										} }
									/>
								) }
							</div>
						</section>
					) ) }
					<Legend
						items={ tiers.map( tier => ( {
							label: getScoreTierLabel( tier ),
							color: getScoreTierColor( tier ),
						} ) ) }
						interactive={ false }
					/>
				</div>
			</GlobalChartsProvider>
		);
	}
	return (
		<Card.Root className="jetpack-boost-overview__history-card">
			<Card.Header>
				<div className="boost-daily-history__header">
					<Card.Title render={ <h2 /> }>{ __( 'Last 30 days scores', 'jetpack-boost' ) }</Card.Title>
					{ ! needsUpgrade && ! isFreshStart && (
						<div className="boost-daily-history__paging">
							<Button
								variant="minimal"
								size="compact"
								aria-label={ __( 'Previous 30 days', 'jetpack-boost' ) }
								onClick={ () => setOffset( value => value + 1 ) }
							>
								<Icon icon={ chevronLeft } />
							</Button>
							<span aria-live="polite">
								{ sprintf(
									/* translators: 1: first date, 2: last date of the visible thirty-day window. */
									__( '%1$s – %2$s', 'jetpack-boost' ),
									dateI18n( 'M j', window.startDate, false ),
									dateI18n( 'M j, Y', window.endDate, false )
								) }
							</span>
							<Button
								variant="minimal"
								size="compact"
								aria-label={ __( 'Next 30 days', 'jetpack-boost' ) }
								disabled={ offset === 0 }
								onClick={ () => setOffset( value => Math.max( 0, value - 1 ) ) }
							>
								<Icon icon={ chevronRight } />
							</Button>
						</div>
					) }
				</div>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
