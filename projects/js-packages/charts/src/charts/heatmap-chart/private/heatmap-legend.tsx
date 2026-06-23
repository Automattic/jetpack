import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useContext } from 'react';
import { HeatmapContext } from '../heatmap-chart';
import type { FC } from 'react';

export interface HeatmapLegendProps {
	/** Number of swatches in the scale. Default 5. */
	steps?: number;
	lessLabel?: string;
	moreLabel?: string;
}

export const HeatmapLegend: FC< HeatmapLegendProps > = ( { steps = 5, lessLabel, moreLabel } ) => {
	const context = useContext( HeatmapContext );
	if ( ! context ) {
		return null;
	}
	const { extent, emptyColorHex, colorFor } = context;
	const [ min, max ] = extent;

	return (
		<Stack direction="row" gap="xs" align="center">
			<Text variant="body-sm">{ lessLabel ?? __( 'Less', 'jetpack-charts' ) }</Text>
			<Stack direction="row" gap="xs">
				{ Array.from( { length: steps }, ( _, index ) => {
					const value = min + ( index / ( steps - 1 ) ) * ( max - min );
					return (
						<span
							key={ index }
							aria-hidden="true"
							style={ {
								width: 'var(--wpds-dimension-size-3xs, 12px)',
								height: 'var(--wpds-dimension-size-3xs, 12px)',
								borderRadius: 'var(--wpds-border-radius-sm, 2px)',
								backgroundColor: index === 0 ? emptyColorHex : colorFor( value ),
							} }
						/>
					);
				} ) }
			</Stack>
			<Text variant="body-sm">{ moreLabel ?? __( 'More', 'jetpack-charts' ) }</Text>
		</Stack>
	);
};
