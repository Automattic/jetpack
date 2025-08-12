import { Group } from '@visx/group';
import { LegendItem, LegendLabel, LegendOrdinal, LegendShape } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';
import clsx from 'clsx';
import { forwardRef, useCallback } from 'react';
import { useChartTheme } from '../../providers/theme';
import styles from './legend.module.scss';
import { valueOrIdentity, valueOrIdentityString, labelTransformFactory } from './utils';
import type { BaseLegendProps } from './types';

const orientationToFlexDirection = {
	horizontal: 'row' as const,
	vertical: 'column' as const,
};

/*
 * Base legend component that displays color-coded items with labels based on visx LegendOrdinal.
 * We avoid using LegendOrdinal directly to enable support for advanced features such as interactivity.
 */
export const BaseLegend = forwardRef< HTMLDivElement, BaseLegendProps >(
	(
		{
			items,
			className,
			orientation = 'horizontal',
			position = 'bottom',
			alignment = 'center',
			shape = 'rect',
			fill = valueOrIdentityString,
			size = valueOrIdentityString,
			labelFormat = valueOrIdentity,
			labelTransform = labelTransformFactory,
			shapeWidth = 16,
			shapeHeight = 16,
			shapeMargin = '2px 4px 2px 0',
			labelAlign = 'left',
			labelFlex = '0 0 auto', // Use natural width instead of expanding to fill space
			labelMargin = '0 4px',
			itemMargin = '0',
			itemDirection = 'row',
			legendLabelProps,
			...legendItemProps
		},
		ref
	) => {
		const theme = useChartTheme();

		// Map new props to internal format using edge-relative alignment
		// Currently only supports top/bottom positioning
		const alignmentVertical: 'top' | 'bottom' = position; // 'top' or 'bottom'
		// Map alignment to horizontal position
		let alignmentHorizontal: 'left' | 'center' | 'right';
		if ( alignment === 'start' ) {
			alignmentHorizontal = 'left';
		} else if ( alignment === 'end' ) {
			alignmentHorizontal = 'right';
		} else {
			alignmentHorizontal = 'center';
		}

		const legendScale = scaleOrdinal( {
			domain: items.map( item => item.label ),
			range: items.map( item => item.color ),
		} );
		const domain = legendScale.domain();

		// For right-aligned vertical legends, use row-reverse to align text consistently

		const getShapeStyle = useCallback(
			( { index }: { index: number } ) => items[ index ]?.shapeStyle,
			[ items ]
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
						className={ clsx(
							styles.legend,
							styles[ `legend--${ orientation }` ],
							styles[ `legend--horizontal-align-${ alignmentHorizontal }` ],
							styles[ `legend--vertical-align-${ alignmentVertical }` ],
							className
						) }
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
								flexDirection={
									orientation === 'vertical' && alignmentHorizontal === 'right'
										? 'row-reverse'
										: itemDirection
								}
								{ ...legendItemProps }
							>
								{ items[ i ]?.renderGlyph ? (
									<svg
										width={ items[ i ]?.glyphSize * 2 }
										height={ items[ i ]?.glyphSize * 2 }
										data-testid="legend-glyph"
									>
										<Group>
											{ items[ i ]?.renderGlyph( {
												key: `legend-glyph-${ label.text }`,
												datum: {},
												index: i,
												color: fill( label ),
												size: items[ i ]?.glyphSize,
												x: items[ i ]?.glyphSize,
												y: items[ i ]?.glyphSize,
											} ) }
										</Group>
									</svg>
								) : (
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
								) }
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
											{ '\u00A0' }
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
