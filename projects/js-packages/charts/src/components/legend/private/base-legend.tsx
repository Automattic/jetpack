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

/**
 * Generates CSS classes for legend container based on layout type
 * @param layout       - Layout type: 'default' or 'grid'
 * @param orientation  - Legend orientation: 'horizontal' or 'vertical'
 * @param alignment    - Legend alignment: 'start', 'center', or 'end'
 * @param position     - Legend position: 'top' or 'bottom'
 * @param gridTemplate - Grid template for layout: 'auto', 'columns', or 'compact'
 * @param className    - Additional CSS class names
 * @return Combined CSS class names for legend container
 */
const getLegendContainerClasses = (
	layout: 'default' | 'grid',
	orientation: 'horizontal' | 'vertical',
	alignment: 'start' | 'center' | 'end',
	position: 'top' | 'bottom',
	gridTemplate?: 'auto' | 'columns' | 'compact',
	className?: string
) => {
	const baseClasses = [
		styles.legend,
		styles[ `legend--alignment-${ alignment }` ],
		styles[ `legend--position-${ position }` ],
	];

	if ( layout === 'grid' ) {
		baseClasses.push(
			styles[ 'legend--grid' ],
			styles[ `legend--grid-template-${ gridTemplate || 'auto' }` ]
		);
	} else {
		baseClasses.push( styles[ `legend--${ orientation }` ] );
	}

	if ( className ) {
		baseClasses.push( className );
	}

	return clsx( ...baseClasses );
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
			// New props for grid layout and custom rendering
			layout = 'default',
			gridColumns,
			gridGap,
			gridTemplate = 'auto',
			renderLegend,
			renderLegendItem,
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

		// If custom renderLegend is provided, use it with theme integration
		if ( renderLegend ) {
			return (
				<div ref={ ref } role="list" data-testid={ `legend-custom` }>
					{ renderLegend( items, theme ) }
				</div>
			);
		}

		// Calculate grid styles for grid layout
		const gridStyles: React.CSSProperties = {};
		if ( layout === 'grid' ) {
			if ( gridTemplate === 'columns' && gridColumns ) {
				gridStyles.gridTemplateColumns = `repeat(${ gridColumns }, 1fr)`;
			}
			if ( gridGap ) {
				gridStyles.gap = gridGap;
			}
		}

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
						data-testid={ `legend-${ layout === 'grid' ? 'grid' : orientation }` }
						className={ getLegendContainerClasses(
							layout,
							orientation,
							alignment,
							position,
							gridTemplate,
							className
						) }
						style={ {
							...( layout === 'default' && {
								flexDirection: orientationToFlexDirection[ orientation ],
							} ),
							...gridStyles,
							...theme.legendContainerStyles,
						} }
					>
						{ labels.map( ( label, i ) => {
							// Use custom renderLegendItem if provided
							if ( renderLegendItem ) {
								return (
									<div key={ `legend-${ label.text }-${ i }` } data-testid="legend-item-custom">
										{ renderLegendItem( items[ i ], i, theme ) }
									</div>
								);
							}

							// Default legend item rendering
							return (
								<LegendItem
									className={ clsx( 'visx-legend-item', styles[ 'legend-item' ] ) }
									data-testid="legend-item"
									key={ `legend-${ label.text }-${ i }` }
									margin={ itemMargin }
									flexDirection={
										orientation === 'vertical' && alignment === 'end'
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
							);
						} ) }
					</div>
				) }
			</LegendOrdinal>
		);
	}
);
