import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useContext } from 'react';
import { useGlobalChartsTheme } from '../../../providers';
import { HeatmapContext } from '../heatmap-chart';
import styles from '../heatmap-chart.module.scss';
import type { FC } from 'react';

export interface HeatmapLegendProps {
	/** Number of swatches in the scale. Default 5. */
	steps?: number;
	lessLabel?: string;
	moreLabel?: string;
}

export const HeatmapLegend: FC< HeatmapLegendProps > = ( { steps = 5, lessLabel, moreLabel } ) => {
	const context = useContext( HeatmapContext );
	const { legend } = useGlobalChartsTheme();
	if ( ! context ) {
		return null;
	}
	const { extent, colorFor } = context;
	const [ min, max ] = extent;

	const labelStyle = legend.labelStyles;

	return (
		<Stack direction="row" gap="xs" align="center">
			<Text variant="body-sm" style={ labelStyle }>
				{ lessLabel ?? __( 'Less', 'jetpack-charts' ) }
			</Text>
			<Stack direction="row" gap="xs">
				{ Array.from( { length: steps }, ( _, index ) => {
					const value = steps <= 1 ? max : min + ( index / ( steps - 1 ) ) * ( max - min );
					return (
						<span
							key={ index }
							aria-hidden="true"
							className={ styles[ 'heatmap-chart__legend-swatch' ] }
							style={ { backgroundColor: colorFor( value ) } }
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
