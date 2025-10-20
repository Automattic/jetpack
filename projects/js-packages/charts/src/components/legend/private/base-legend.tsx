import { Group } from '@visx/group';
import { LegendItem, LegendLabel, LegendOrdinal, LegendShape } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';
import clsx from 'clsx';
import {
	type RefAttributes,
	type ForwardRefExoticComponent,
	type KeyboardEvent,
	forwardRef,
	useCallback,
	useContext,
} from 'react';
import { useTextTruncation } from '../../../hooks';
import { GlobalChartsContext, useGlobalChartsTheme } from '../../../providers';
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
			legendItemClassName,
			render,
			interactive = false,
			chartId,
			...legendItemProps
		},
		ref
	) => {
		const theme = useGlobalChartsTheme();
		const context = useContext( GlobalChartsContext );

		const legendScale = scaleOrdinal( {
			domain: items.map( item => item.label ),
			range: items.map( item => item.color ),
		} );
		const domain = legendScale.domain();

		const getShapeStyle = useCallback(
			( { index }: { index: number } ) => items[ index ]?.shapeStyle,
			[ items ]
		);

		// Handle legend item clicks for interactive mode
		const handleLegendClick = useCallback(
			( seriesLabel: string ) => {
				if ( interactive && chartId && context ) {
					context.toggleSeriesVisibility( chartId, seriesLabel );
				}
			},
			[ interactive, chartId, context ]
		);

		// Check if a series is visible
		const isSeriesVisible = useCallback(
			( seriesLabel: string ) => {
				if ( ! interactive || ! chartId || ! context ) {
					return true;
				}
				return context.isSeriesVisible( chartId, seriesLabel );
			},
			[ interactive, chartId, context ]
		);

		// Create event handlers to avoid inline arrow functions
		const createClickHandler = useCallback(
			( labelText: string ) => {
				if ( ! interactive ) {
					return undefined;
				}
				return () => handleLegendClick( labelText );
			},
			[ interactive, handleLegendClick ]
		);

		const createKeyDownHandler = useCallback(
			( labelText: string ) => {
				if ( ! interactive ) {
					return undefined;
				}
				return ( event: KeyboardEvent ) => {
					if ( event.key === 'Enter' || event.key === ' ' ) {
						event.preventDefault();
						handleLegendClick( labelText );
					}
				};
			},
			[ interactive, handleLegendClick ]
		);

		return render ? (
			render( items )
		) : (
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
						} }
					>
						{ labels.map( ( label, i ) => {
							const visible = isSeriesVisible( label.text );
							const handleClick = createClickHandler( label.text );
							const handleKeyDown = createKeyDownHandler( label.text );

							return (
								<LegendItem
									className={ clsx(
										'visx-legend-item',
										styles[ 'legend-item' ],
										interactive && styles[ 'legend-item--interactive' ],
										! visible && styles[ 'legend-item--inactive' ],
										legendItemClassName
									) }
									data-testid="legend-item"
									key={ `legend-${ label.text }-${ i }` }
									margin={ itemMargin }
									flexDirection={
										orientation === 'vertical' && alignment === 'end'
											? 'row-reverse'
											: itemDirection
									}
									onClick={ handleClick }
									onKeyDown={ handleKeyDown }
									role={ interactive ? 'button' : undefined }
									tabIndex={ interactive ? 0 : undefined }
									aria-pressed={ interactive ? visible : undefined }
									aria-label={
										interactive
											? `${ label.text }: ${ visible ? 'visible' : 'hidden' }. Toggle visibility.`
											: undefined
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
