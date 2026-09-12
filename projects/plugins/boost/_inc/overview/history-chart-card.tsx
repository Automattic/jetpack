import { BarChart, GlobalChartsProvider } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { formatNumber } from '@automattic/number-formatters';
import { Spinner } from '@wordpress/components';
import { dateI18n, getDate } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight, desktop, mobile, Icon } from '@wordpress/icons';
import { Button, Card, Notice } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
import { bucketHistoryDays, type HistoryDay, type HistoryWindow } from './lib/history-days';
import { getScoreTier, getScoreTierColor } from './lib/score-utils';
import UpgradeCTA from './upgrade-cta';
import './history-chart-card.scss';
import type { PerformanceHistoryData } from './lib/use-performance-history';
import type { CategoryHighlightSelection, SeriesData } from '@automattic/charts';

type Props = {
	range: HistoryWindow;
	dayCount: 15 | 30;
	onPrevious: () => void;
	onNext: () => void;
	canGoNext: boolean;
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

// The empty-bar selector in history-chart-card.scss matches this fill.
const emptyColor = 'var(--jetpack-boost-history-empty)';

export function buildHistorySeries( days: HistoryDay[] ): SeriesData[] {
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
		<div className="jetpack-boost-overview__history-tooltip boost-daily-history__empty-tooltip">
			<div className="jetpack-boost-overview__tooltip-date">
				{ dateI18n( 'F j, Y', getDate( `${ date }T12:00:00` ), false ) }
			</div>
			<div className="boost-daily-history__empty-copy">
				{ __( 'No scores recorded before feature was unlocked', 'jetpack-boost' ) }
			</div>
		</div>
	);
}

export function HistoryTooltip( {
	period,
}: {
	period: PerformanceHistoryData[ 'periods' ][ number ];
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
							{ device === 'desktop'
								? __( 'Desktop', 'jetpack-boost' )
								: __( 'Mobile', 'jetpack-boost' ) }
							<span
								className="jetpack-boost-overview__series-swatch"
								style={ {
									backgroundColor: getScoreTierColor(
										getScoreTier( dimensions[ `${ device }_overall_score` ] )
									),
								} }
								aria-hidden="true"
							/>
						</dt>
						<dd>
							{ sprintf(
								/* translators: %d is the performance score. */
								__( '%d/100', 'jetpack-boost' ),
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
	return (
		<div className="jetpack-boost-overview__history-tooltip boost-daily-history__score-tooltip">
			{ content }
		</div>
	);
}

export default function HistoryChartCard( {
	range,
	dayCount,
	onPrevious,
	onNext,
	canGoNext,
	data,
	isLoading,
	isVisible = true,
	isError,
	error,
	onRetry,
	needsUpgrade,
	isFreshStart,
	onDismissFreshStart,
}: Props ) {
	const days = bucketHistoryDays( data?.periods ?? [], range );
	const series = buildHistorySeries( days );
	const [ activeHighlight, setActiveHighlight ] = useState< {
		index: number;
		selection: CategoryHighlightSelection;
	} | null >( null );
	const updateHighlight = useCallback(
		( index: number, selection: CategoryHighlightSelection | null ) => {
			setActiveHighlight( previous =>
				selection ? { index, selection } : previous?.index === index ? null : previous
			);
		},
		[]
	);
	useEffect( () => {
		setActiveHighlight( null );
	}, [ range.startDate, range.endDate, isVisible ] );
	const highlight = isVisible ? activeHighlight?.selection : null;
	let content;
	if ( needsUpgrade ) {
		content = (
			<Notice.Root intent="info" spokenMessage={ null }>
				<Notice.Title>{ __( 'Unlock historical performance', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>
					{ __( 'Upgrade and learn more about your site performance over time.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<UpgradeCTA />
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( isLoading && ! data?.periods.length ) {
		content = (
			<div className="jetpack-boost-overview__chart-loading">
				<Spinner />
			</div>
		);
	} else if ( isError && ! isLoading ) {
		content = (
			<Notice.Root
				intent="error"
				spokenMessage={
					isVisible ? __( 'Failed to load performance history', 'jetpack-boost' ) : ''
				}
			>
				<Notice.Title>{ __( 'Failed to load performance history', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>{ error?.message }</Notice.Description>
				<Notice.Actions>
					<Button onClick={ onRetry }>{ __( 'Try again', 'jetpack-boost' ) }</Button>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( isFreshStart ) {
		content = (
			<Notice.Root intent="success" spokenMessage={ null }>
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
					{ highlight && (
						<div
							aria-hidden="true"
							className="boost-daily-history__highlight"
							data-testid="history-highlight"
							style={ {
								insetInlineStart: `calc(var(--wpds-dimension-padding-lg) + ${ highlight.x }px)`,
								width: highlight.width,
							} }
						/>
					) }
					{ series.map( ( deviceSeries, index ) => {
						const isRecordedHighlight =
							activeHighlight?.index === index &&
							days.some( day => day.period && day.date === highlight?.datum.label );
						return (
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
								<div className="boost-daily-history__plot">
									{ isVisible && (
										<BarChart
											key={ `${ range.startDate }-${ range.endDate }` }
											data={ [ deviceSeries ] }
											withTooltips
											gridVisibility="x"
											onCategoryHighlightChange={ selection => updateHighlight( index, selection ) }
											tooltipPlacement={ isRecordedHighlight ? 'beside' : 'auto' }
											tooltipAnchorTop={ isRecordedHighlight ? -96 - index * 149 : undefined }
											margin={ { top: 8, bottom: 24, left: 25, right: 0 } }
											options={ {
												xScale: { paddingInner: 0.024, paddingOuter: 0.7 },
												yScale: { domain: [ 0, 100 ], nice: false, zero: true },
												axis: {
													y: { tickValues: [ 0, 50, 100 ] },
													x: {
														tickValues: days.length
															? [
																	days[ 0 ].date,
																	days[ Math.floor( ( days.length - 1 ) / 2 ) ].date,
																	days[ days.length - 1 ].date,
															  ]
															: [],
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
						);
					} ) }
				</div>
			</GlobalChartsProvider>
		);
	}
	return (
		<Card.Root className="jetpack-boost-overview__history-card">
			<Card.Header className="boost-daily-history__card-header">
				<div className="boost-daily-history__header">
					<Card.Title render={ <h2 /> }>
						{ sprintf(
							/* translators: %d is the number of days in the visible history window. */
							__( 'Last %d days scores', 'jetpack-boost' ),
							dayCount
						) }
					</Card.Title>
					{ ! needsUpgrade && ! isFreshStart && (
						<div className="boost-daily-history__paging">
							<Button
								variant="minimal"
								size="compact"
								aria-label={ sprintf(
									/* translators: %d is the number of days to page backward. */
									__( 'Previous %d days', 'jetpack-boost' ),
									dayCount
								) }
								onClick={ onPrevious }
							>
								<Icon icon={ chevronLeft } />
							</Button>
							<span aria-live="polite">
								{ sprintf(
									/* translators: 1: first date, 2: last date of the visible history window. */
									__( '%1$s – %2$s', 'jetpack-boost' ),
									dateI18n( 'M j', range.startDate, false ),
									dateI18n( 'M j, Y', range.endDate, false )
								) }
							</span>
							<Button
								variant="minimal"
								size="compact"
								aria-label={ sprintf(
									/* translators: %d is the number of days to page forward. */
									__( 'Next %d days', 'jetpack-boost' ),
									dayCount
								) }
								disabled={ ! canGoNext }
								onClick={ onNext }
							>
								<Icon icon={ chevronRight } />
							</Button>
						</div>
					) }
				</div>
			</Card.Header>
			<Card.Content className="boost-daily-history__body">{ content }</Card.Content>
		</Card.Root>
	);
}
