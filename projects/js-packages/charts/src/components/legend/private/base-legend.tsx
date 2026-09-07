import { Group } from '@visx/group';
import { LegendItem, LegendLabel, LegendOrdinal, LegendShape } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';
import { _x, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import {
	type RefAttributes,
	type ForwardRefExoticComponent,
	type KeyboardEvent,
	forwardRef,
	useCallback,
	useContext,
} from 'react';
import { ChartInstanceContext } from '../../../charts/private/chart-instance-context';
import { useTextTruncation } from '../../../hooks';
import { GlobalChartsContext, useGlobalChartsTheme } from '../../../providers';
import { useStandaloneScopeClass } from '../../../providers/chart-scope';
import { valueOrIdentity, valueOrIdentityString, labelTransformFactory } from '../utils';
import styles from './base-legend.module.scss';
import type { BaseLegendItem, BaseLegendProps } from '../types';

const ALIGNMENT_TO_FLEX = {
	start: 'flex-start',
	center: 'center',
	end: 'flex-end',
} as const;

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

// Interactive items get a toggle affordance; non-interactive items only need a label
// when hidden, since a visible item's own text already serves as its accessible name.
const getLegendItemAriaLabel = (
	text: string,
	value: BaseLegendItem[ 'value' ],
	visible: boolean,
	interactive: boolean
) => {
	const accessibleText =
		value != null && value !== ''
			? sprintf(
					/* translators: 1: legend item label; 2: legend item value. */
					_x( '%1$s, %2$s', 'legend item label and value', 'jetpack-charts' ),
					text,
					String( value )
			  )
			: text;

	if ( interactive ) {
		if ( visible ) {
			return sprintf(
				/* translators: %s: legend item label (e.g. a series or segment name) */
				_x(
					'%s: visible. Toggle visibility.',
					'visible interactive legend item',
					'jetpack-charts'
				),
				accessibleText
			);
		}
		return sprintf(
			/* translators: %s: legend item label (e.g. a series or segment name) */
			_x( '%s: hidden. Toggle visibility.', 'hidden interactive legend item', 'jetpack-charts' ),
			accessibleText
		);
	}
	if ( visible ) {
		return undefined;
	}
	return sprintf(
		/* translators: %s: legend item label (e.g. a series or segment name) */
		_x( '%s: hidden', 'hidden non-interactive legend item', 'jetpack-charts' ),
		accessibleText
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
			alignment = 'center',
			shape = 'rect',
			fill = valueOrIdentityString,
			size = valueOrIdentityString,
			labelFormat = valueOrIdentity,
			labelTransform = labelTransformFactory,
			itemStyles,
			itemClassName,
			labelStyles,
			labelClassName,
			shapeStyles,
			render,
			interactive = false,
			chartId,
		},
		ref
	) => {
		const { margin: itemMargin = '0', flexDirection: itemDirection = 'row' } = itemStyles ?? {};
		const {
			justifyContent: labelJustifyContent = 'flex-start',
			flex: labelFlex = '0 0 auto',
			margin: labelMargin = '0 4px',
			maxWidth,
			textOverflow = 'wrap',
		} = labelStyles ?? {};
		const {
			width: shapeWidth = 16,
			height: shapeHeight = 16,
			margin: shapeMargin = '2px 4px 2px 0',
		} = shapeStyles ?? {};

		const theme = useGlobalChartsTheme();
		const context = useContext( GlobalChartsContext );
		const chartInstanceContext = useContext( ChartInstanceContext );
		const standaloneScopeClass = useStandaloneScopeClass();

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
			( seriesLabels: string[] ) => {
				if ( interactive && chartId && context ) {
					const representativeVisible = context.isSeriesVisible( chartId, seriesLabels[ 0 ] );
					seriesLabels.forEach( label =>
						context.setSeriesVisibility( chartId, label, ! representativeVisible )
					);
				}
			},
			[ interactive, chartId, context ]
		);

		// Visibility is display state, not interaction state: a series hidden
		// programmatically must read as hidden even when the legend cannot be clicked.
		const isSeriesVisible = useCallback(
			( seriesLabel: string ) => {
				if ( chartInstanceContext?.isSeriesVisible ) {
					return chartInstanceContext.isSeriesVisible( seriesLabel );
				}
				if ( ! chartId || ! context ) {
					return true;
				}
				return context.isSeriesVisible( chartId, seriesLabel );
			},
			[ chartId, chartInstanceContext, context ]
		);

		// Create event handlers to avoid inline arrow functions
		const createClickHandler = useCallback(
			( seriesLabels: string[] ) => {
				if ( ! interactive ) {
					return undefined;
				}
				return () => handleLegendClick( seriesLabels );
			},
			[ interactive, handleLegendClick ]
		);

		const createKeyDownHandler = useCallback(
			( seriesLabels: string[] ) => {
				if ( ! interactive ) {
					return undefined;
				}
				return ( event: KeyboardEvent ) => {
					if ( event.key === 'Enter' || event.key === ' ' ) {
						event.preventDefault();
						handleLegendClick( seriesLabels );
					}
				};
			},
			[ interactive, handleLegendClick ]
		);

		const flexAlignment = ALIGNMENT_TO_FLEX[ alignment ] ?? 'center';

		return render ? (
			render( items )
		) : (
			<LegendOrdinal
				scale={ legendScale }
				labelFormat={ labelFormat }
				labelTransform={ labelTransform }
			>
				{ labels => (
					<Stack
						ref={ ref }
						direction={ orientation === 'vertical' ? 'column' : 'row' }
						gap={ orientation === 'vertical' ? 'sm' : 'lg' }
						align={ orientation === 'vertical' ? flexAlignment : undefined }
						justify={ orientation === 'horizontal' ? flexAlignment : undefined }
						wrap={ orientation === 'horizontal' ? 'wrap' : undefined }
						role={ interactive ? undefined : 'list' }
						data-testid={ `legend-${ orientation }` }
						className={ clsx( standaloneScopeClass, styles.legend, className ) }
						style={ theme.legend?.containerStyles }
					>
						{ labels.map( ( label, i ) => {
							const matchedItem = items[ i ];
							// A grouped item toggles/reads every series it controls; a plain item just its own.
							const seriesLabels = matchedItem?.seriesLabels?.length
								? matchedItem.seriesLabels
								: [ label.text ];
							const visible = isSeriesVisible( seriesLabels[ 0 ] );
							const handleClick = createClickHandler( seriesLabels );
							const handleKeyDown = createKeyDownHandler( seriesLabels );

							return (
								<LegendItem
									className={ clsx(
										'visx-legend-item',
										styles[ 'legend-item' ],
										interactive && styles[ 'legend-item--interactive' ],
										! visible && styles[ 'legend-item--inactive' ],
										itemClassName
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
									role={ interactive ? 'button' : 'listitem' }
									tabIndex={ interactive ? 0 : undefined }
									aria-pressed={ interactive ? visible : undefined }
									aria-label={ getLegendItemAriaLabel(
										label.text,
										matchedItem?.value,
										visible,
										interactive
									) }
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
										data-testid="legend-label"
										className={ clsx(
											'visx-legend-label',
											styles[ 'legend-item-label' ],
											labelClassName
										) }
										style={ {
											flex: labelFlex,
											margin: labelMargin,
											...theme.legend?.labelStyles,
										} }
									>
										<Stack align="center" gap="sm" justify={ labelJustifyContent }>
											<LegendText
												text={ label.text }
												textOverflow={ textOverflow }
												maxWidth={ maxWidth }
											/>
											{ matchedItem?.value != null && matchedItem.value !== '' && (
												<span className={ styles[ 'legend-item-value' ] }>
													{ '\u00A0' }
													{ matchedItem.value }
												</span>
											) }
										</Stack>
									</LegendLabel>
								</LegendItem>
							);
						} ) }
					</Stack>
				) }
			</LegendOrdinal>
		);
	}
);
