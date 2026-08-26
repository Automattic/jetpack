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
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { ChartEmptyState } from '../chart-empty-state';
import styles from './leaderboard-chart.module.scss';
import type { WooChartTheme } from '../../hooks/use-chart-theme';
import type { DataFormat } from '../../types';
import type { ComponentProps, ReactNode } from 'react';

type LeaderboardChartData = ComponentProps< typeof BaseLeaderboardChart >[ 'data' ];

export type { LeaderboardChartData };

export type LegendLabels = {
	primary: string;
	comparison: string;
};

export type LeaderboardChartProps = {
	className?: string;

	/**
	 * Leaderboard data (label, currentValue, previousValue, currentShare, previousShare, delta)
	 */
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
	 * Show only complete rows that fit the widget height instead of scrolling.
	 *
	 * Defaults to `true` here, unlike the underlying charts prop, because widgets
	 * sit in fixed-height tiles. Pass `false` to keep the list scrollable.
	 * @default true
	 */
	fitRows?: boolean;
};

/**
 * "Top X by Y" ranking chart wrapping `LeaderboardChartUnresponsive` with the
 * package's formatting and styling.
 *
 * Must render inside a `GlobalChartsProvider`: colors, theme, and element
 * styles are read from that context.
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
		options: { useMultipliers: true, decimals: 2 },
	},
	emptyStateIcon,
	emptyStateText,
	style,
	fitRows = true,
}: LeaderboardChartProps ) {
	const { getElementStyles, theme } = useGlobalChartsContext();

	const valueFormatter = useMemo(
		() => ( value: number ) => formatMetricValue( value, dataFormat.type, dataFormat.options ),
		[ dataFormat ]
	);

	/**
	 * Bar color for overlay-label mode.
	 *
	 * The label sits on top of the bar, so the bar needs to read as a faint
	 * tint of the primary color. We can't pass a translucent color through the
	 * chart's `primaryColor` prop — it resolves the value via getElementStyles,
	 * which strips the alpha channel. Instead we pre-blend the primary with
	 * white to produce the opaque equivalent of an 8% alpha fill.
	 */
	const barColor = useMemo( () => {
		if ( ! withOverlayLabel ) {
			return undefined;
		}
		const { color: primaryColor } = getElementStyles( { index: 0 } );
		return lightenHexColor( normalizeColorToHex( primaryColor ), 0.92 );
	}, [ withOverlayLabel, getElementStyles ] );

	// The `style` prop wins over the theme's bar radius, for per-widget overrides.
	const chartStyle = useMemo( () => {
		const wooTheme = theme as WooChartTheme | undefined;
		const barBorderRadius = wooTheme?.leaderboardChart?.barBorderRadius;
		if ( ! barBorderRadius && ! style ) {
			return undefined;
		}
		return {
			'--a8c-charts-border-radius-leaderboard-bar': barBorderRadius,
			...style,
		} as React.CSSProperties;
	}, [ theme, style ] );

	const isEmptyData = ! data || data.length === 0;

	if ( isEmptyData ) {
		return <ChartEmptyState icon={ emptyStateIcon } text={ emptyStateText } />;
	}

	return (
		<Stack
			direction="column"
			justify="space-between"
			gap="lg"
			className={ clsx( styles.container, className ) }
		>
			<BaseLeaderboardChart
				data={ data }
				loading={ loading }
				withComparison={ withComparison }
				valueFormatter={ valueFormatter }
				legendLabels={ legendLabels }
				primaryColor={ barColor }
				withOverlayLabel={ withOverlayLabel }
				showLegend={ false }
				fitRows={ fitRows }
				style={ chartStyle }
				className={ styles.chart }
			>
				{ showLegend && (
					<Legend
						className={ styles.legend }
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
