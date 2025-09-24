import { Group } from '@visx/group';
import { LegendItem, LegendLabel, LegendOrdinal, LegendShape } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';
import clsx from 'clsx';
import { type RefAttributes, type ForwardRefExoticComponent, forwardRef, useCallback } from 'react';
import { useTextTruncation } from '../../../hooks';
import { useGlobalChartsTheme } from '../../../providers';
import { valueOrIdentity, valueOrIdentityString, labelTransformFactory } from '../utils';
import styles from './base-legend.module.scss';
import type { BaseLegendProps } from '../types';

const orientationToFlexDirection = {
	horizontal: 'row' as const,
	vertical: 'column' as const,
};

// Component for legend text with truncation detection
// Moved outside BaseLegend to prevent recreation on every render
const LegendText = ( {
	text,
	textOverflow,
	maxWidth,
}: {
	text: string;
	textOverflow: 'ellipsis' | 'wrap';
	maxWidth?: string;
} ) => {
	const isEllipsis = maxWidth != null && textOverflow === 'ellipsis';
	const [ textRef, isTruncated ] = useTextTruncation( Boolean( isEllipsis ) );

	return (
		<span
			ref={ textRef }
			className={ clsx(
				styles[ 'legend-item-text' ],
				maxWidth != null && styles[ `legend-item-text--${ textOverflow }` ]
			) }
			style={ {
				...( maxWidth != null && {
					maxWidth,
					minWidth: 0,
				} ),
			} }
			title={ isEllipsis && isTruncated ? text : undefined }
		>
			{ text }
		</span>
	);
};

/*
 * Base legend component that displays color-coded items with labels based on visx LegendOrdinal.
 * We avoid using LegendOrdinal directly to enable support for advanced features such as interactivity.
 */
export const BaseLegend: ForwardRefExoticComponent<
	BaseLegendProps & RefAttributes< HTMLDivElement >
> = forwardRef< HTMLDivElement, BaseLegendProps >(
	(
		{
			items,
			className,
			orientation = 'horizontal',
			position = 'bottom',
			alignment = 'center',
			maxWidth,
			textOverflow = 'wrap',
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
			legendMargin,
			legendStyle,
			...legendItemProps
		},
		ref
	) => {
		const theme = useGlobalChartsTheme();

		const legendScale = scaleOrdinal( {
			domain: items.map( item => item.label ),
			range: items.map( item => item.color ),
		} );
		const domain = legendScale.domain();

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
							styles[ `legend--alignment-${ alignment }` ],
							styles[ `legend--position-${ position }` ],
							className
						) }
						style={ {
							flexDirection: orientationToFlexDirection[ orientation ],
							...theme.legendContainerStyles,
							...( typeof legendMargin === 'string'
								? { margin: legendMargin }
								: legendMargin && {
										marginTop:
											typeof legendMargin.top === 'number'
												? `${ legendMargin.top }px`
												: legendMargin.top,
										marginRight:
											typeof legendMargin.right === 'number'
												? `${ legendMargin.right }px`
												: legendMargin.right,
										marginBottom:
											typeof legendMargin.bottom === 'number'
												? `${ legendMargin.bottom }px`
												: legendMargin.bottom,
										marginLeft:
											typeof legendMargin.left === 'number'
												? `${ legendMargin.left }px`
												: legendMargin.left,
								  } ),
							...legendStyle,
						} }
					>
						{ labels.map( ( label, i ) => (
							<LegendItem
								className={ clsx( 'visx-legend-item', styles[ 'legend-item' ] ) }
								data-testid="legend-item"
								key={ `legend-${ label.text }-${ i }` }
								margin={ itemMargin }
								flexDirection={
									orientation === 'vertical' && alignment === 'end' ? 'row-reverse' : itemDirection
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
									className={ clsx( 'visx-legend-label', styles[ 'legend-item-label' ] ) }
									style={ {
										justifyContent: labelAlign,
										flex: labelFlex,
										margin: labelMargin,
										...theme.legendLabelStyles,
									} }
									{ ...legendLabelProps }
								>
									<LegendText
										text={ label.text }
										textOverflow={ textOverflow }
										maxWidth={ maxWidth }
									/>
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
