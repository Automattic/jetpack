import {
	Annotation,
	CircleSubject,
	Connector,
	HtmlLabel,
	Label,
	LineSubject,
} from '@visx/annotation';
import { DataContext } from '@visx/xychart';
import merge from 'deepmerge';
import { useContext, useRef, useEffect, useState, useMemo } from 'react';
import { useGlobalChartsTheme } from '../../../providers';
import { isSafari, resolveCssVariable } from '../../../utils';
import LineChartAnnotationLabelWithPopover, {
	POPOVER_BUTTON_SIZE,
} from './line-chart-annotation-label-popover';
import type { LineChartAnnotationProps } from '../types';
import type { LabelProps } from '@visx/annotation';
import type { TextProps } from '@visx/text';
import type { FC } from 'react';

type SubjectType = 'circle' | 'line-vertical' | 'line-horizontal';

const ANNOTATION_MAX_WIDTH = 125; // visx default
const ANNOTATION_INIT_HEIGHT = 100;

export const getLabelPosition = ( {
	subjectType,
	x,
	xMax,
	y,
	yMin,
	yMax,
	maxWidth,
	height,
}: {
	subjectType: SubjectType;
	x: number;
	xMax: number;
	y: number;
	yMin: number;
	yMax: number;
	maxWidth?: number;
	height?: number | null;
} ): {
	dx: number;
	dy: number;
	isFlippedHorizontally: boolean;
	isFlippedVertically: boolean;
} => {
	const annotationMaxWidth = maxWidth ?? ANNOTATION_MAX_WIDTH;
	const annotationHeight = height ?? ANNOTATION_INIT_HEIGHT;
	let dx = 15;
	let dy = 15;
	let isFlippedHorizontally = false;
	let isFlippedVertically = false;

	if ( subjectType === 'line-horizontal' ) {
		dx = 0;
		dy = 20;
	}

	if ( subjectType === 'line-vertical' ) {
		dx = 20;
		dy = 0;
	}

	// Smart horizontal positioning: if annotation would extend beyond right edge, position it to the left
	// Account for the connector offset (dx) in boundary calculations
	const effectiveX = x + dx;

	if ( effectiveX + annotationMaxWidth > xMax ) {
		isFlippedHorizontally = true;

		if ( subjectType === 'circle' ) {
			dx = -dx; // Just flip to the left side with same offset
		} else if ( subjectType === 'line-vertical' ) {
			dx = -20; // Position to the left of the line
		}
	}

	// Smart vertical positioning: check both top and bottom edges
	// For circle annotations, they are positioned below by default (dy > 0)
	// Only flip when close to bottom edge to position above
	if ( subjectType === 'circle' ) {
		// Check if positioning below would extend beyond bottom edge
		if ( y + dy + annotationHeight > yMin ) {
			// Too close to bottom edge, position above
			isFlippedVertically = true;
			dy = -Math.abs( dy ); // Ensure negative value to position above the point
		}
		// When close to top edge, keep default below positioning (no flip needed)
	} else if ( y - annotationHeight < yMax ) {
		// Too close to top edge, position below
		if ( subjectType === 'line-horizontal' ) {
			isFlippedVertically = true;
			dy = Math.abs( dy ); // Ensure positive value to position below the point
		} else if ( subjectType === 'line-vertical' ) {
			isFlippedVertically = true; // For anchor adjustment only
		}
	} else if ( y + annotationHeight > yMin ) {
		// Too close to bottom edge, position above
		if ( subjectType === 'line-horizontal' ) {
			isFlippedVertically = true;
			dy = -Math.abs( dy ); // Ensure negative value to position above the point
		} else if ( subjectType === 'line-vertical' ) {
			isFlippedVertically = true; // For anchor adjustment only
		}
	}

	return { dx, dy, isFlippedHorizontally, isFlippedVertically };
};

const getHorizontalAnchor = (
	subjectType: SubjectType,
	isFlippedHorizontally: boolean
): LabelProps[ 'horizontalAnchor' ] => {
	if ( subjectType === 'line-horizontal' ) {
		return isFlippedHorizontally ? 'end' : 'start';
	}

	return undefined;
};

const getVerticalAnchor = (
	subjectType: SubjectType,
	isFlippedVertically: boolean,
	y: number,
	yMax: number,
	height: number
): TextProps[ 'verticalAnchor' ] => {
	if ( subjectType === 'line-vertical' ) {
		if ( isFlippedVertically ) {
			// If flipped due to top edge, anchor to top; if flipped due to bottom edge, anchor to bottom
			return y - height < yMax ? 'start' : 'end';
		}

		return 'start';
	}

	return undefined;
};

const LineChartAnnotation: FC< LineChartAnnotationProps > = ( {
	datum,
	title,
	subtitle,
	subjectType = 'circle',
	styles: datumStyles,
	testId,
	renderLabel,
	renderLabelPopover,
} ) => {
	const providerTheme = useGlobalChartsTheme();
	const { xScale, yScale } = useContext( DataContext ) || {};
	const labelRef = useRef< SVGGElement >( null );
	const [ height, setHeight ] = useState< number | null >( null );

	// Deep merge styles to preserve nested object properties
	const styles = merge( providerTheme.annotationStyles ?? {}, datumStyles ?? {} );

	// visx annotation parts apply these colors as SVG presentation attributes,
	// where CSS var() cannot resolve. Resolve WPDS tokens to concrete values first.
	const resolveColor = ( value?: string ): string | undefined =>
		value ? resolveCssVariable( value ) ?? value : value;

	// Measure the label height once after initial render
	useEffect( () => {
		if ( labelRef.current?.getBBox ) {
			const bbox = labelRef.current.getBBox();
			setHeight( bbox.height );
		}
	}, [] );

	const positionData = useMemo( () => {
		if ( ! datum || ! datum.date || datum.value == null || ! xScale || ! yScale ) return null;

		const x = xScale( datum.date );
		const y = yScale( datum.value );

		if ( typeof x !== 'number' || typeof y !== 'number' ) return null;

		const [ yMin, yMax ] = yScale.range().map( Number );
		const [ xMin, xMax ] = xScale.range().map( Number );

		// If a custom label is provided, use the provided position
		if ( renderLabel ) {
			return {
				x,
				dx: 0,
				y,
				dy: 0,
				yMin,
				yMax,
				xMin,
				xMax,
				isFlippedHorizontally: false,
				isFlippedVertically: false,
			};
		}

		const position = getLabelPosition( {
			subjectType,
			x,
			xMax,
			y,
			yMin,
			yMax,
			maxWidth: styles?.label?.maxWidth,
			height,
		} );

		return { x, y, yMin, yMax, xMin, xMax, ...position };
	}, [ datum, xScale, yScale, subjectType, styles?.label?.maxWidth, height, renderLabel ] );

	if ( ! positionData ) return null;

	const { x, y, yMin, yMax, xMin, xMax, dx, dy, isFlippedHorizontally, isFlippedVertically } =
		positionData;

	const getLabelY = () => {
		const labelY = styles?.label?.y;

		if ( labelY === 'start' ) return yMax;
		if ( labelY === 'end' ) return yMin;

		return labelY;
	};

	const getLabelX = () => {
		const labelX = styles?.label?.x;

		if ( labelX === 'start' ) return xMin;
		if ( labelX === 'end' ) return xMax;

		return labelX;
	};

	const labelPosition = {
		x: getLabelX(),
		y: getLabelY(),
	};

	// Safari has a bug where children of an SVG foreignObject are not positioned correctly https://bugs.webkit.org/show_bug.cgi?id=23113
	// This is a workaround to position the label correctly
	const getSafariHTMLLabelPosition = () => {
		const labelWidth = POPOVER_BUTTON_SIZE;
		const labelHeight = POPOVER_BUTTON_SIZE;

		return isSafari()
			? {
					transform: `translate(${
						x +
						( dx || 0 ) +
						( typeof labelPosition.x === 'number' ? labelPosition.x - x : 0 ) -
						labelWidth
					}px, ${
						y +
						( dy || 0 ) +
						( typeof labelPosition.y === 'number' ? labelPosition.y - y : 0 ) -
						labelHeight
					}px)`,
					width: labelWidth,
					height: labelHeight,
			  }
			: undefined;
	};

	return (
		<g data-testid={ testId }>
			<Annotation x={ x } y={ y } dx={ dx } dy={ dy }>
				<Connector { ...styles?.connector } stroke={ resolveColor( styles?.connector?.stroke ) } />
				{ subjectType === 'circle' && (
					<CircleSubject
						{ ...styles?.circleSubject }
						fill={ resolveColor( styles?.circleSubject?.fill ) }
						stroke={ resolveColor( styles?.circleSubject?.stroke ) }
					/>
				) }
				{ subjectType === 'line-vertical' && (
					<LineSubject
						min={ yMax }
						max={ yMin }
						{ ...{ ...styles?.lineSubject, orientation: 'vertical' } }
					/>
				) }
				{ subjectType === 'line-horizontal' && (
					<LineSubject
						min={ xMin }
						max={ xMax }
						{ ...{ ...styles?.lineSubject, orientation: 'horizontal' } }
					/>
				) }
				{ renderLabel ? (
					<HtmlLabel { ...styles?.label } { ...labelPosition }>
						<div style={ getSafariHTMLLabelPosition() }>
							{ renderLabelPopover ? (
								<LineChartAnnotationLabelWithPopover
									title={ title }
									subtitle={ subtitle }
									renderLabel={ renderLabel }
									renderLabelPopover={ renderLabelPopover }
								/>
							) : (
								renderLabel( { title, subtitle } )
							) }
						</div>
					</HtmlLabel>
				) : (
					<g ref={ labelRef }>
						<Label
							title={ title }
							subtitle={ subtitle }
							{ ...styles?.label }
							anchorLineStroke={ resolveColor( styles?.label?.anchorLineStroke ) }
							backgroundFill={ resolveColor( styles?.label?.backgroundFill ) }
							{ ...labelPosition }
							horizontalAnchor={ getHorizontalAnchor( subjectType, isFlippedHorizontally ) }
							verticalAnchor={ getVerticalAnchor(
								subjectType,
								isFlippedVertically,
								y,
								yMax,
								height ?? ANNOTATION_INIT_HEIGHT
							) }
						/>
					</g>
				) }
			</Annotation>
		</g>
	);
};

export default LineChartAnnotation;
