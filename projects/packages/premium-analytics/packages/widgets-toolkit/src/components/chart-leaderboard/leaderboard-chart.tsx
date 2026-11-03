/**
 * External dependencies
 */
import {
	LeaderboardChartUnresponsive as BaseLeaderboardChart,
	useGlobalChartsContext,
	Legend,
	lightenHexColor,
	normalizeColorToHex,
	Icon,
	Stack,
} from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { formatChartName } from '../../helpers/format-chart-name';
import {
	formatListMetricCount,
	getListMetricLabel,
	type ListMetric,
} from '../../helpers/list-metrics';
import { AbbreviatedValue } from '../abbreviated-value';
import { ChartEmptyState } from '../chart-empty-state';
import styles from './leaderboard-chart.module.scss';
import type { DataFormat } from '../../types';
import type { ComponentProps, ReactNode } from 'react';

type LeaderboardChartData = ComponentProps< typeof BaseLeaderboardChart >[ 'data' ];

export type { LeaderboardChartData };

export type LegendLabels = {
	primary: string;
	comparison: string;
};

/** What the rows are and what their values count, named in a header above them. */
export type LeaderboardColumns = {
	/** The rows, e.g. "Pages". */
	label: string;
	metric: ListMetric;
};

export type LeaderboardChartProps = {
	className?: string;

	data: LeaderboardChartData;

	loading?: boolean;

	withComparison?: boolean;

	withOverlayLabel?: boolean;

	legendLabels?: LegendLabels;

	dataFormat?: DataFormat;

	showLegend?: boolean;

	emptyState?: ReactNode;

	emptyStateIcon?: React.ComponentProps< typeof Icon >[ 'icon' ];

	emptyStateText?: string;

	style?: React.CSSProperties & {
		'--a8c-charts-border-radius-leaderboard-bar'?: string;
	};

	/**
	 * Show only complete rows that fit the widget height instead of scrolling. Defaults
	 * to `true` here, unlike the underlying charts prop, because widgets sit in
	 * fixed-height tiles.
	 * @default true
	 */
	fitRows?: boolean;

	/** Names the rows and the metric above them, and the unit in the exact-value tooltip. */
	columns?: LeaderboardColumns;

	/** What the chart shows, such as the widget title; the chart is named "Chart: <title>". */
	chartTitle?: string;
};

/**
 * "Top X by Y" ranking chart wrapping `LeaderboardChartUnresponsive`. Must render
 * inside a `GlobalChartsProvider`: colors, theme, and element styles come from it.
 */
export function LeaderboardChart( {
	className,
	data,
	loading = false,
	withComparison = false,
	withOverlayLabel = false,
	showLegend = true,
	legendLabels,
	dataFormat = {
		type: 'currency',
		options: { useMultipliers: true },
	},
	emptyStateIcon,
	emptyStateText,
	style,
	fitRows = true,
	columns,
	chartTitle,
}: LeaderboardChartProps ) {
	const { getElementStyles } = useGlobalChartsContext();

	const metric = columns?.metric;
	const valueFormatter = useMemo(
		() => ( value: number ) => (
			<AbbreviatedValue
				value={ value }
				dataFormat={ dataFormat }
				formatRestored={
					metric ? exact => formatListMetricCount( metric, value, exact ) : undefined
				}
			/>
		),
		[ dataFormat, metric ]
	);

	// A translucent `primaryColor` would not survive `getElementStyles`, which strips
	// the alpha channel, so pre-blend with white to the opaque equivalent of an 8% fill.
	const barColor = useMemo( () => {
		if ( ! withOverlayLabel ) {
			return undefined;
		}
		const { color: primaryColor } = getElementStyles( { index: 0 } );
		return lightenHexColor( normalizeColorToHex( primaryColor ), 0.92 );
	}, [ withOverlayLabel, getElementStyles ] );

	const isEmptyData = ! data || data.length === 0;

	if ( isEmptyData ) {
		return <ChartEmptyState icon={ emptyStateIcon } text={ emptyStateText } />;
	}

	return (
		<Stack
			direction="column"
			justify="space-between"
			gap={ columns ? 'sm' : 'lg' }
			className={ clsx( styles.container, columns && styles.hasColumns, className ) }
		>
			{ columns && (
				<div className={ styles.columns }>
					<span className={ styles.columnsLabel }>{ columns.label }</span>
					<span className={ styles.columnsMetric }>{ getListMetricLabel( columns.metric ) }</span>
				</div>
			) }
			<BaseLeaderboardChart
				data={ data }
				ariaLabel={ formatChartName( chartTitle ) }
				loading={ loading }
				withComparison={ withComparison }
				valueFormatter={ valueFormatter }
				legendLabels={ legendLabels }
				primaryColor={ barColor }
				withOverlayLabel={ withOverlayLabel }
				// Diverging bars would pull away from labels drawn over them.
				negativeBars={ withOverlayLabel ? 'clamp' : 'diverge' }
				showLegend={ false }
				fitRows={ fitRows }
				style={ style }
				className={ styles.chart }
			>
				{ showLegend && (
					<Legend
						orientation="horizontal"
						position="bottom"
						alignment="center"
						shapeStyles={ { width: 8, height: 8 } }
						shape="circle"
						labelStyles={ {
							textOverflow: 'ellipsis',
							maxWidth: '100%',
						} }
						itemClassName={ styles.legendItem }
						labelClassName={ styles.legendLabel }
					/>
				) }
			</BaseLeaderboardChart>
		</Stack>
	);
}
