import { BarChart, GlobalChartsProvider } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { formatNumber } from '@automattic/number-formatters';
import { Spinner } from '@wordpress/components';
import { dateI18n, getDate } from '@wordpress/date';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight, desktop, mobile, Icon } from '@wordpress/icons';
import { Button, Card, Notice, Popover, Tooltip, VisuallyHidden } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bucketHistoryDays, type HistoryDay, type HistoryWindow } from './lib/history-days';
import { getScoreTier, getScoreTierColor } from './lib/score-utils';
import './history-chart-card.scss';
import type { PerformanceHistoryData } from './lib/use-performance-history';
import type { BandHighlightSelection, SeriesData } from '@automattic/charts';
import type { ComponentProps, ElementType } from 'react';

type Props = {
	range: HistoryWindow;
	dayCount: 15 | 30;
	onPrevious: () => void;
	onNext: () => void;
	canGoNext: boolean;
	canGoPrevious: boolean;
	hasOlderHistory?: boolean;
	showSingleDate: boolean;
	data?: PerformanceHistoryData | null;
	isLoading?: boolean;
	isVisible?: boolean;
	isError?: boolean;
	error?: Error | null;
	onRetry: () => void;
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

export function EmptyDayTooltip( {
	date,
	isBeforeHistory,
	dateComponent: DateElement = 'div',
}: {
	date: string;
	isBeforeHistory?: boolean;
	dateComponent?: ElementType;
} ) {
	return (
		<div className="jetpack-boost-overview__history-tooltip boost-daily-history__empty-tooltip">
			<DateElement className="jetpack-boost-overview__tooltip-date">
				{ dateI18n( 'F j, Y', getDate( `${ date }T12:00:00` ), false ) }
			</DateElement>
			<div className="boost-daily-history__empty-copy">
				{ isBeforeHistory
					? __( 'No scores recorded before the feature was unlocked.', 'jetpack-boost' )
					: __( 'No scores recorded for this day.', 'jetpack-boost' ) }
			</div>
		</div>
	);
}

type HistoryPeriod = PerformanceHistoryData[ 'periods' ][ number ];
type DayDetails = { day: HistoryDay; selection: BandHighlightSelection };
export function HistoryTooltip( {
	period,
	dateComponent: DateElement = 'div',
}: {
	period: HistoryPeriod;
	dateComponent?: ElementType;
} ) {
	const dimensions = period.dimensions;
	const content = (
		<>
			<DateElement className="jetpack-boost-overview__tooltip-date">
				{ dateI18n( 'F j, Y', new Date( period.timestamp ), false ) }
			</DateElement>
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

function PopoverDate( props: ComponentProps< 'div' > ) {
	return <Popover.Title render={ <div /> } { ...props } />;
}

function PagingButton( {
	label,
	icon,
	disabled,
	onClick,
}: {
	label: string;
	icon: JSX.Element;
	disabled: boolean;
	onClick: () => void;
} ) {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Button
						variant="minimal"
						size="compact"
						aria-label={ label }
						disabled={ disabled }
						onClick={ onClick }
					/>
				}
			>
				<Icon icon={ icon } />
			</Tooltip.Trigger>
			<Tooltip.Popup
				className="boost-daily-history__paging-tooltip"
				// The button pads the icon, so this puts the tooltip 9px below the chevron.
				positioner={ <Tooltip.Positioner side="bottom" sideOffset={ 4 } /> }
			>
				{ label }
			</Tooltip.Popup>
		</Tooltip.Root>
	);
}

export default function HistoryChartCard( {
	range,
	dayCount,
	onPrevious,
	onNext,
	canGoNext,
	hasOlderHistory,
	canGoPrevious,
	showSingleDate,
	data,
	isLoading,
	isVisible = true,
	isError,
	error,
	onRetry,
}: Props ) {
	const { startDate, endDate } = range;
	const days = useMemo(
		() => bucketHistoryDays( data?.periods ?? [], { startDate, endDate } ),
		[ data?.periods, startDate, endDate ]
	);
	const singleDate = showSingleDate ? days.find( day => day.period )?.date : undefined;
	const series = useMemo( () => buildHistorySeries( days ), [ days ] );
	const tickValues = useMemo(
		() =>
			days.length
				? [
						days[ 0 ].date,
						days[ Math.floor( ( days.length - 1 ) / 2 ) ].date,
						days[ days.length - 1 ].date,
					]
				: [],
		[ days ]
	);
	const [ activeHighlight, setActiveHighlight ] = useState< {
		index: number;
		selection: BandHighlightSelection;
	} | null >( null );
	const updateHighlight = useCallback(
		( index: number, selection: BandHighlightSelection | null ) => {
			setActiveHighlight( previous =>
				selection ? { index, selection } : previous?.index === index ? null : previous
			);
		},
		[]
	);
	// The popover's hover bridge decides when the pointer opens and closes it, which keeps it
	// hoverable; the card decides which day it shows, and drives it directly for the keyboard.
	const [ hoverOpen, setHoverOpen ] = useState( false );
	const [ keyboardOpen, setKeyboardOpen ] = useState( false );
	const [ anchor, setAnchor ] = useState< HTMLDivElement | null >( null );
	const [ lastHovered, setLastHovered ] = useState< DayDetails | null >( null );
	const pointerType = useRef( '' );
	useEffect( () => {
		setActiveHighlight( null );
		setHoverOpen( false );
		setKeyboardOpen( false );
		setLastHovered( null );
	}, [ range.startDate, range.endDate, isVisible ] );
	const highlight = isVisible ? activeHighlight?.selection : null;
	const highlightedDay = highlight && days.find( day => day.date === highlight.datum.label );
	const hovered = useMemo< DayDetails | null >(
		() => ( highlight && highlightedDay ? { day: highlightedDay, selection: highlight } : null ),
		[ highlight, highlightedDay ]
	);
	useEffect( () => {
		// Any other day under the pointer owns the card; the hold outlives the chart's delayed
		// hide only while the popover is still open.
		if ( hovered || highlight ) {
			setLastHovered( hovered );
		} else if ( ! hoverOpen && ! keyboardOpen ) {
			setLastHovered( null );
		}
	}, [ hovered, highlight, hoverOpen, keyboardOpen ] );
	// The chart drops its highlight shortly after the pointer leaves the plot, so while the bridge
	// holds the popover open, keep showing the day the pointer left from.
	const shown = hovered ?? ( hoverOpen && ! highlight ? lastHovered : null );
	const details = ( hoverOpen || keyboardOpen ) && shown ? shown : null;
	const band = details?.selection ?? highlight;
	// base-ui unmounts the popup, and drops the chart's focus guards, only once its exit ends.
	const [ popupDay, setPopupDay ] = useState< HistoryDay | null >( null );
	if ( details && details.day !== popupDay ) {
		setPopupDay( details.day );
	}
	const isBeforeHistory = ( day: HistoryDay ) =>
		hasOlderHistory === false && ! days.some( slot => slot.period && slot.date < day.date );
	let content;
	let bodyClassName;
	if ( isLoading && ! data?.periods.length ) {
		// The spinner stands in for the chart, so it keeps the chart's edge-to-edge body.
		bodyClassName = 'boost-daily-history__body';
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
	} else {
		bodyClassName = 'boost-daily-history__body';
		content = (
			<GlobalChartsProvider>
				<Popover.Root
					open={ Boolean( details && anchor ) }
					onOpenChange={ ( isOpen, { reason } ) => {
						// A mouse click is chart interaction, but a tap is how touch and pen show the details.
						if (
							reason === 'trigger-press' &&
							! ( isOpen && [ 'touch', 'pen' ].includes( pointerType.current ) )
						) {
							return;
						}
						setHoverOpen( isOpen );
						if ( ! isOpen && reason === 'escape-key' ) {
							setKeyboardOpen( false );
						}
					} }
				>
					<Popover.Trigger
						openOnHover
						delay={ 0 }
						nativeButton={ false }
						// The chart keeps its own semantics and tab order; only the hover bridge is wanted.
						role={ undefined }
						tabIndex={ undefined }
						aria-haspopup={ undefined }
						aria-expanded={ undefined }
						render={ <div className="boost-daily-history" /> }
						data-testid="history-chart"
						onPointerDown={ event => {
							pointerType.current = event.pointerType;
						} }
						onKeyDown={ event => {
							// Only the keys that end the chart's own selection close the details.
							if ( event.key.startsWith( 'Arrow' ) ) {
								setKeyboardOpen( true );
							} else if ( event.key === 'Tab' || event.key === 'Escape' ) {
								setKeyboardOpen( false );
							}
						} }
						onBlur={ event => {
							// The chart moves focus to its own tooltip, which must not count as leaving.
							if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
								setKeyboardOpen( false );
							}
						} }
					>
						{ band && (
							<div
								// A new element per day makes the popover re-anchor.
								key={ band.datum.label }
								ref={ setAnchor }
								aria-hidden="true"
								className="boost-daily-history__highlight"
								data-testid="history-highlight"
								style={ {
									// The highlight uses an SVG x coordinate measured from the physical left.
									left: `calc(var(--wpds-dimension-padding-lg) + ${ band.x }px)`,
									width: band.width,
								} }
							/>
						) }

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
								<div className="boost-daily-history__plot">
									{ isVisible && (
										<BarChart
											key={ `${ range.startDate }-${ range.endDate }` }
											data={ [ deviceSeries ] }
											withTooltips
											gridVisibility="x"
											onBandHighlightChange={ selection => updateHighlight( index, selection ) }
											margin={ { top: 8, bottom: 24, left: 25, right: 0 } }
											options={ {
												xScale: { paddingInner: 0.024, paddingOuter: 0.7 },
												yScale: { domain: [ 0, 100 ], nice: false, zero: true },
												axis: {
													y: { tickValues: [ 0, 50, 100 ] },
													x: {
														tickValues,
														tickFormat: value =>
															dateI18n( 'M j', getDate( `${ value }T12:00:00` ), false ),
													},
												},
											} }
											renderTooltip={ ( { tooltipData } ) => {
												const day = days.find(
													slot => slot.date === tooltipData?.nearestDatum?.datum.label
												);
												// Keyboard focus lands here; the popover shows the same details.
												return day ? (
													<VisuallyHidden>
														{ day.period ? (
															<HistoryTooltip period={ day.period } />
														) : (
															<EmptyDayTooltip
																date={ day.date }
																isBeforeHistory={ isBeforeHistory( day ) }
															/>
														) }
													</VisuallyHidden>
												) : null;
											} }
										/>
									) }
								</div>
							</section>
						) ) }
					</Popover.Trigger>
					{ popupDay && (
						<Popover.Popup
							variant="unstyled"
							// Portalled outside the page, so it takes the page class for the score colour tokens.
							className="jetpack-boost-overview boost-daily-history__popover"
							// Hidden from assistive technology: the chart's own tooltip carries these details.
							aria-hidden="true"
							data-testid="history-popover"
							initialFocus={ false }
							finalFocus={ false }
							// Beside the day, so a flip cannot land the box on the card's paging controls.
							positioner={
								<Popover.Positioner
									anchor={ anchor }
									side="inline-end"
									align="start"
									sideOffset={ 0 }
									collisionPadding={ 0 }
								/>
							}
						>
							{ popupDay.period ? (
								<HistoryTooltip period={ popupDay.period } dateComponent={ PopoverDate } />
							) : (
								<EmptyDayTooltip
									date={ popupDay.date }
									isBeforeHistory={ isBeforeHistory( popupDay ) }
									dateComponent={ PopoverDate }
								/>
							) }
						</Popover.Popup>
					) }
				</Popover.Root>
			</GlobalChartsProvider>
		);
	}
	return (
		<Card.Root className="jetpack-boost-overview__history-card">
			<Card.Header className="boost-daily-history__card-header">
				<div className="boost-daily-history__header">
					<Card.Title render={ <h2 /> }>
						{ canGoNext
							? __( 'Score history', 'jetpack-boost' )
							: sprintf(
									/* translators: %d is the number of days in the visible history window. */
									__( 'Last %d days', 'jetpack-boost' ),
									dayCount
								) }
					</Card.Title>
					<Tooltip.Provider>
						<div className="boost-daily-history__paging">
							<PagingButton
								label={ sprintf(
									/* translators: %d is the number of days to page backward. */
									__( 'Previous %d days', 'jetpack-boost' ),
									dayCount
								) }
								icon={ isRTL() ? chevronRight : chevronLeft }
								disabled={ ! canGoPrevious }
								onClick={ onPrevious }
							/>
							<span aria-live="polite">
								{ singleDate
									? dateI18n( 'M j, Y', getDate( `${ singleDate }T12:00:00` ), false )
									: sprintf(
											/* translators: 1: first date, 2: last date of the visible history window. */
											__( '%1$s – %2$s', 'jetpack-boost' ),
											dateI18n( 'M j', range.startDate, false ),
											dateI18n( 'M j, Y', range.endDate, false )
										) }
							</span>
							<PagingButton
								label={ sprintf(
									/* translators: %d is the number of days to page forward. */
									__( 'Next %d days', 'jetpack-boost' ),
									dayCount
								) }
								icon={ isRTL() ? chevronLeft : chevronRight }
								disabled={ ! canGoNext }
								onClick={ onNext }
							/>
						</div>
					</Tooltip.Provider>
				</div>
			</Card.Header>
			<Card.Content className={ bodyClassName }>{ content }</Card.Content>
		</Card.Root>
	);
}
