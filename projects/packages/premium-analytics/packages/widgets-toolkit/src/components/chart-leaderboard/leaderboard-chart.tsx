/**
 * External dependencies
 */
import {
	LeaderboardChartUnresponsive as BaseLeaderboardChart,
	useGlobalChartsContext,
	Legend,
	lightenHexColor,
	normalizeColorToHex,
} from '@automattic/charts';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Icon, Stack } from '@wordpress/ui';
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
	/**
	 * Card container styles
	 */
	className?: string;

	/**
	 * Leaderboard data (label, currentValue, previousValue, currentShare, previousShare, delta)
	 */
	data: LeaderboardChartData;

	/**
	 * Whether the widget is in a loading state
	 */
	loading?: boolean;

	/**
	 * Whether to show comparison data
	 */
	withComparison?: boolean;

	/**
	 * Whether to show overlay label on bars
	 */
	withOverlayLabel?: boolean;

	/**
	 * Custom legend labels
	 */
	legendLabels?: LegendLabels;

	/**
	 * Format for displaying values
	 */
	dataFormat?: DataFormat;

	/**
	 * Whether to show the legend
	 */
	showLegend?: boolean;

	/**
	 * Custom empty state content to display when no data is available
	 */
	emptyState?: ReactNode;

	/**
	 * Icon to display in the empty state
	 */
	emptyStateIcon?: React.ComponentProps< typeof Icon >[ 'icon' ];

	/**
	 * Text to display in the empty state
	 */
	emptyStateText?: string;

	/**
	 * Custom styling for the chart container
	 */
	style?: React.CSSProperties & {
		'--a8c--charts--leaderboard--bar--border-radius'?: string;
	};
};

/**
 * Generic LeaderboardChart component for displaying ranking/leaderboard data.
 * Used for "top X by Y" type visualizations (e.g., sales by source, by channel, by campaign).
 *
 * This component wraps @automattic/charts LeaderboardChartUnresponsive with standardized formatting and styling.
 *
 * **Requirements:**
 * - Must be rendered within a GlobalChartsProvider context to access chart styling (colors, themes, element styles)
 *
 * Features:
 * - Automatic empty state handling
 * - Configurable value formatting (currency, number, percentage, etc.)
 * - Comparison mode support
 * - Customizable legend labels
 * - Overlay label support for alternative styling
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
}: LeaderboardChartProps ) {
	const { getElementStyles, theme } = useGlobalChartsContext();

	/**
	 * Create value formatter from dataFormat configuration
	 */
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

	/**
	 * Merge theme bar border radius with style prop.
	 * Style prop takes precedence for per-widget overrides.
	 */
	const chartStyle = useMemo( () => {
		const wooTheme = theme as WooChartTheme | undefined;
		const barBorderRadius = wooTheme?.leaderboardChart?.barBorderRadius;
		if ( ! barBorderRadius && ! style ) {
			return undefined;
		}
		return {
			'--a8c--charts--leaderboard--bar--border-radius': barBorderRadius,
			...style,
		} as React.CSSProperties;
	}, [ theme, style ] );

	// Check if we have valid data
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
