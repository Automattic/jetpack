import { LegendItem, LegendLabel, LegendOrdinal, LegendShape } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';
import clsx from 'clsx';
import { forwardRef, useCallback } from 'react';
import { useChartTheme } from '../../providers/theme';
import styles from './legend.module.scss';
import { valueOrIdentity, valueOrIdentityString, labelTransformFactory } from './utils';
import type { LegendProps } from './types';

const orientationToFlexDirection = {
	horizontal: 'row' as const,
	vertical: 'column' as const,
};

/*
 * Base legend component that displays color-coded items with labels based on visx LegendOrdinal.
 * We avoid using LegendOrdinal directly to enable support for advanced features such as interactivity.
 */
export const BaseLegend = forwardRef< HTMLDivElement, LegendProps >(
	(
		{
			items,
			className,
			orientation = 'horizontal',
			shape = 'rect',
			fill = valueOrIdentityString,
			size = valueOrIdentityString,
			labelFormat = valueOrIdentity,
			labelTransform = labelTransformFactory,
			shapeWidth = 16,
			shapeHeight = 16,
			shapeMargin = '2px 4px 2px 0',
			labelAlign = 'left',
			labelFlex = '1',
			labelMargin = '0 4px',
			itemMargin = '0',
			itemDirection = 'row',
			legendLabelProps,
			...legendItemProps
		},
		ref
	) => {
		const theme = useChartTheme();
		const legendScale = scaleOrdinal( {
			domain: items.map( item => item.label ),
			range: items.map( item => item.color ),
		} );
		const domain = legendScale.domain();

		const getShapeStyle = useCallback(
			( { index }: { index: number } ) => {
				return items[ index ]?.shapeStyle ?? theme.legendShapeStyles?.[ index ] ?? {};
			},
			[ items, theme ]
		);

		return (
			<LegendOrdinal
				scale={ legendScale }
				labelFormat={ labelFormat }
				labelTransform={ labelTransform }
			>
				{ labels => (
					<div
						ref={ ref }
						role="list"
						data-testid={ `legend-${ orientation }` }
						className={ clsx( styles.legend, styles[ `legend--${ orientation }` ], className ) }
						style={ {
							flexDirection: orientationToFlexDirection[ orientation ],
							...theme.legendContainerStyles,
						} }
					>
						{ labels.map( ( label, i ) => (
							<LegendItem
								className={ styles[ 'legend-item' ] }
								data-testid="legend-item"
								key={ `legend-${ label.text }-${ i }` }
								margin={ itemMargin }
								flexDirection={ itemDirection }
								{ ...legendItemProps }
							>
								<LegendShape
									shape={ shape }
									height={ shapeHeight }
									width={ shapeWidth }
									margin={ shapeMargin }
									item={ domain[ i ] }
									itemIndex={ i }
									label={ label }
									fill={ fill }
									size={ size }
									shapeStyle={ getShapeStyle }
								/>
								<LegendLabel
									style={ {
										justifyContent: labelAlign,
										flex: labelFlex,
										margin: labelMargin,
										...theme.legendLabelStyles,
									} }
									{ ...legendLabelProps }
								>
									{ label.text }
									{ items.find( item => item.label === label.text )?.value && (
										<span className={ styles[ 'legend-item-value' ] }>
											{ items.find( item => item.label === label.text )?.value }
										</span>
									) }
								</LegendLabel>
							</LegendItem>
						) ) }
					</div>
				) }
			</LegendOrdinal>
		);
	}
);
