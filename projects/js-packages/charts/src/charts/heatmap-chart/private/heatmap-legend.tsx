import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useContext } from 'react';
import { useGlobalChartsTheme } from '../../../providers';
import { warnOnce } from '../../../utils/warn-once';
import styles from '../heatmap-chart.module.scss';
import { HEATMAP_SCALE_STEPS } from './heatmap-buckets';
import { HeatmapContext } from './heatmap-context';
import { isEmptyValue } from './use-heatmap-colors';
import type { CSSProperties, FC } from 'react';

export interface HeatmapLegendProps {
	/**
	 * Number of color swatches in the scale, not counting the empty-cell swatch.
	 * Default 5. Under the `buckets` and `log` scales a cell paints on exactly
	 * those five steps, so the legend keeps them and a different count here is
	 * ignored with a warning. The `linear` scale is continuous, so there the
	 * count is free.
	 */
	steps?: number;
	/**
	 * `swatches` spaces the steps out as cell-sized squares; `bar` joins them
	 * into one continuous band with rounded ends. Default `swatches`.
	 */
	variant?: 'swatches' | 'bar';
	lessLabel?: string;
	moreLabel?: string;
}

export const HeatmapLegend: FC< HeatmapLegendProps > = ( {
	steps: requestedSteps,
	variant = 'swatches',
	lessLabel,
	moreLabel,
} ) => {
	const context = useContext( HeatmapContext );
	const { legend } = useGlobalChartsTheme();
	if ( ! context ) {
		return null;
	}
	const { extent, fillVars } = context;
	const ownStepsIgnored =
		context.scale !== 'linear' &&
		requestedSteps !== undefined &&
		requestedSteps !== HEATMAP_SCALE_STEPS;
	if ( ownStepsIgnored ) {
		warnOnce(
			'heatmap:legendSteps',
			`steps is fixed under the ${ context.scale } scale, where a cell paints on exactly ${ HEATMAP_SCALE_STEPS } steps, so the legend keeps them.`
		);
	}
	const steps = ownStepsIgnored ? HEATMAP_SCALE_STEPS : ( requestedSteps ?? HEATMAP_SCALE_STEPS );
	const labelStyle = legend.labelStyles;
	const showsEmptyCell = isEmptyValue( 0, extent );

	return (
		<Stack direction="row" gap="xs" align="center">
			<Text
				variant="body-sm"
				className={ styles[ 'heatmap-chart__legend-label' ] }
				style={ labelStyle }
			>
				{ lessLabel ?? __( 'Less', 'jetpack-charts' ) }
			</Text>
			<Stack
				direction="row"
				gap={ variant === 'bar' ? undefined : 'xs' }
				aria-hidden="true"
				data-testid="heatmap-legend-scale"
				className={ variant === 'bar' ? styles[ 'heatmap-chart__legend-scale--bar' ] : undefined }
			>
				{ showsEmptyCell && (
					<span
						data-testid="heatmap-legend-empty-swatch"
						className={ clsx(
							styles[ 'heatmap-chart__legend-swatch' ],
							styles[ 'heatmap-chart__legend-swatch--empty' ]
						) }
					/>
				) }
				{ Array.from( { length: steps }, ( _, index ) => {
					const intensity = steps <= 1 ? 1 : index / ( steps - 1 );
					return (
						<span
							key={ index }
							data-testid="heatmap-legend-swatch"
							className={ styles[ 'heatmap-chart__legend-swatch' ] }
							style={
								{
									...fillVars,
									'--a8c-charts-heatmap-cell-intensity': intensity,
								} as CSSProperties
							}
						/>
					);
				} ) }
			</Stack>
			<Text
				variant="body-sm"
				className={ styles[ 'heatmap-chart__legend-label' ] }
				style={ labelStyle }
			>
				{ moreLabel ?? __( 'More', 'jetpack-charts' ) }
			</Text>
		</Stack>
	);
};
