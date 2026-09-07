import { LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Notice, Text } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
import InterstitialModalCTA from '../../app/assets/src/js/features/upgrade-cta/interstitial-modal-cta';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import type { PerformanceHistoryData } from './lib/use-performance-history';
import type { SeriesData } from '@automattic/charts';
import type { ComponentProps } from 'react';

type History = NonNullable< PerformanceHistoryData >;
type Props = {
	data?: PerformanceHistoryData | null;
	isLoading?: boolean;
	isError?: boolean;
	onRetry: () => void;
	needsUpgrade?: boolean;
	isFreshStart?: boolean;
	onDismissFreshStart: () => void;
};

export function buildHistorySeries( data?: PerformanceHistoryData | null ): SeriesData[] {
	if ( ! data?.periods.length ) {
		return [];
	}
	return [
		{
			label: __( 'Desktop', 'jetpack-boost' ),
			data: data.periods.map( period => ( {
				date: new Date( period.timestamp ),
				value: period.dimensions.desktop_overall_score,
			} ) ),
			options: { stroke: '#1d4ed8' },
		},
		{
			label: __( 'Mobile', 'jetpack-boost' ),
			data: data.periods.map( period => ( {
				date: new Date( period.timestamp ),
				value: period.dimensions.mobile_overall_score,
			} ) ),
			options: { stroke: '#16a34a' },
		},
	];
}

export function HistoryTooltip( { period }: { period: History[ 'periods' ][ number ] } ) {
	const dimensions = period.dimensions;
	return (
		<div className="jetpack-boost-overview__history-tooltip">
			<Text>{ new Date( period.timestamp ).toLocaleString() }</Text>
			<dl>
				<dt>{ __( 'Overall score', 'jetpack-boost' ) }</dt>
				<dd>
					{ getScoreLetter( dimensions.mobile_overall_score, dimensions.desktop_overall_score ) }
				</dd>
				{ ( [ 'desktop', 'mobile' ] as const ).map( device => (
					<div key={ device }>
						<dt>
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
						<dd>{ sprintf( '%.2fs', dimensions[ `${ device }_lcp` ] ) }</dd>
						<dt>{ __( 'Total Blocking Time', 'jetpack-boost' ) }</dt>
						<dd>{ sprintf( '%.2fs', dimensions[ `${ device }_tbt` ] ) }</dd>
						<dt>{ __( 'Cumulative Layout Shift', 'jetpack-boost' ) }</dt>
						<dd>{ sprintf( '%.2f', dimensions[ `${ device }_cls` ] ) }</dd>
					</div>
				) ) }
			</dl>
		</div>
	);
}

function handleUpgrade() {
	recordBoostEvent( 'performance_history_upgrade_cta_click', {} );
}

export default function HistoryChartCard( {
	data,
	isLoading,
	isError,
	onRetry,
	needsUpgrade,
	isFreshStart,
	onDismissFreshStart,
}: Props ) {
	const series = useMemo( () => buildHistorySeries( data ), [ data ] );
	const renderTooltip = useCallback<
		NonNullable< ComponentProps< typeof LineChart >[ 'renderTooltip' ] >
	>(
		( { tooltipData } ) => {
			const timestamp = tooltipData?.nearestDatum?.datum.date?.getTime();
			const period = data?.periods.find( entry => entry.timestamp === timestamp );
			return period ? <HistoryTooltip period={ period } /> : null;
		},
		[ data ]
	);
	let content;
	if ( isLoading && ! data?.periods.length ) {
		content = (
			<div className="jetpack-boost-overview__chart-loading">
				<Spinner />
			</div>
		);
	} else if ( isError && ! isLoading ) {
		content = (
			<Notice.Root intent="error">
				<Notice.Title>{ __( 'Failed to load performance history', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Actions>
					<Button onClick={ onRetry }>{ __( 'Try again', 'jetpack-boost' ) }</Button>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( needsUpgrade ) {
		content = (
			<Notice.Root intent="info">
				<Notice.Title>{ __( 'Unlock historical performance', 'jetpack-boost' ) }</Notice.Title>
				<Notice.Description>
					{ __( 'Upgrade and learn more about your site performance over time.', 'jetpack-boost' ) }
				</Notice.Description>
				<Notice.Actions>
					<InterstitialModalCTA
						identifier="historical-performance"
						customModalTrigger={
							<Button onClick={ handleUpgrade }>{ __( 'Upgrade now', 'jetpack-boost' ) }</Button>
						}
					/>
				</Notice.Actions>
			</Notice.Root>
		);
	} else if ( isFreshStart ) {
		content = (
			<Notice.Root intent="success">
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
	} else if ( ! data || ! series.length ) {
		content = (
			<Text>
				{ __(
					'Performance history will appear here once enough data has been collected.',
					'jetpack-boost'
				) }
			</Text>
		);
	} else {
		content = (
			<div className="jetpack-boost-overview__chart-canvas">
				<LineChart
					data={ series }
					height={ 240 }
					showLegend
					withGradientFill={ false }
					withEndGlyphs={ data.periods.length === 1 }
					renderTooltip={ renderTooltip }
					options={ {
						xScale: { domain: [ new Date( data.startDate ), new Date( data.endDate ) ] },
						yScale: { domain: [ 0, 100 ], nice: false },
					} }
				>
					<LineChart.AnnotationsOverlay>
						{ data.annotations.map( ( annotation, index ) => (
							<LineChart.Annotation
								key={ `${ annotation.timestamp }-${ index }` }
								datum={ { date: new Date( annotation.timestamp ), value: 100 } }
								title={ annotation.text }
								subjectType="line-vertical"
							/>
						) ) }
					</LineChart.AnnotationsOverlay>
				</LineChart>
			</div>
		);
	}
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Historical performance', 'jetpack-boost' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
		</Card.Root>
	);
}
