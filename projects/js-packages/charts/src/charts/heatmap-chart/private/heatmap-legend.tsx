import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useContext } from 'react';
import { useGlobalChartsTheme } from '../../../providers';
import styles from '../heatmap-chart.module.scss';
import { HeatmapContext } from './heatmap-context';
import type { CSSProperties, FC } from 'react';

export interface HeatmapLegendProps {
	/** Number of swatches in the scale. Default 5. */
	steps?: number;
	lessLabel?: string;
	moreLabel?: string;
}

export const HeatmapLegend: FC< HeatmapLegendProps > = ( { steps = 5, lessLabel, moreLabel } ) => {
	const context = useContext( HeatmapContext );
	const { legend, backgroundColor } = useGlobalChartsTheme();
	if ( ! context ) {
		return null;
	}
	const { primaryColorHex } = context;
	const labelStyle = legend.labelStyles;

	return (
		<Stack direction="row" gap="xs" align="center">
			<Text variant="body-sm" style={ labelStyle }>
				{ lessLabel ?? __( 'Less', 'jetpack-charts' ) }
			</Text>
			<Stack direction="row" gap="xs">
				{ Array.from( { length: steps }, ( _, index ) => {
					const intensity = steps <= 1 ? 1 : index / ( steps - 1 );
					return (
						<span
							key={ index }
							aria-hidden="true"
							className={ styles[ 'heatmap-chart__legend-swatch' ] }
							style={
								{
									'--heatmap-primary': primaryColorHex,
									'--heatmap-bg': backgroundColor,
									'--intensity': intensity,
								} as CSSProperties
							}
						/>
					);
				} ) }
			</Stack>
			<Text variant="body-sm" style={ labelStyle }>
				{ moreLabel ?? __( 'More', 'jetpack-charts' ) }
			</Text>
		</Stack>
	);
};
