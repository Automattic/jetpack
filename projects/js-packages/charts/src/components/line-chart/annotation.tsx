import { Annotation, CircleSubject, Connector, Label, LineSubject } from '@visx/annotation';
import { CircleSubjectProps } from '@visx/annotation/lib/components/CircleSubject';
import { ConnectorProps } from '@visx/annotation/lib/components/Connector';
import { LineSubjectProps } from '@visx/annotation/lib/components/LineSubject';
import { TextProps } from '@visx/text';
import { DataContext } from '@visx/xychart';
import { merge } from 'lodash';
import { useContext } from 'react';
import { useChartTheme } from '../../providers/theme/theme-provider';
import type { DataPointDate } from '../../types';
import type { LabelProps } from '@visx/annotation/lib/components/label';
import type { FC } from 'react';

export type AnnotationStyles = {
	circleSubject?: Omit< CircleSubjectProps, 'x' | 'y' > & { fill?: string };
	lineSubject?: Omit< LineSubjectProps, 'x' | 'y' >;
	connector?: Omit< ConnectorProps, 'x' | 'y' | 'dx' | 'dy' >;
	label?: Omit< LabelProps, 'title' | 'subtitle' >;
};

type SubjectType = 'circle' | 'line-vertical' | 'line-horizontal';

const ANNOTATION_MAX_WIDTH = 125; // visx default
const ANNOTATION_MAX_HEIGHT = 100;

export type LineChartAnnotation = {
	datum: DataPointDate;
	title: string;
	subtitle: string;
	subjectType?: SubjectType;
	styles?: AnnotationStyles;
};

const getLabelPosition = ( {
	subjectType,
	x,
	xMax,
	y,
	yMin,
	yMax,
	maxWidth,
}: {
	subjectType: SubjectType;
	x: number;
	xMax: number;
	y: number;
	yMin: number;
	yMax: number;
	maxWidth?: number;
} ): {
	dx: number;
	dy: number;
	isFlippedHorizontally: boolean;
	isFlippedVertically: boolean;
} => {
	const annotationMaxWidth = maxWidth ?? ANNOTATION_MAX_WIDTH;
	const annotationMaxHeight = ANNOTATION_MAX_HEIGHT;
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
	if ( x + annotationMaxWidth > xMax ) {
		isFlippedHorizontally = true;
		if ( subjectType === 'circle' ) {
			dx = -dx; // Just flip to the left side with same offset
		} else if ( subjectType === 'line-vertical' ) {
			dx = -20; // Position to the left of the line
		}
	}

	// Smart vertical positioning: check both top and bottom edges
	if ( y - annotationMaxHeight < yMax ) {
		// Too close to top edge, position below
		if ( subjectType === 'circle' || subjectType === 'line-horizontal' ) {
			isFlippedVertically = true;
			dy = Math.abs( dy ); // Ensure positive value to position below the point
		} else if ( subjectType === 'line-vertical' ) {
			isFlippedVertically = true; // For anchor adjustment only
		}
	} else if ( y + annotationMaxHeight > yMin ) {
		// Too close to bottom edge, position above
		if ( subjectType === 'circle' || subjectType === 'line-horizontal' ) {
			isFlippedVertically = true;
			dy = -Math.abs( dy ); // Ensure negative value to position above the point
		} else if ( subjectType === 'line-vertical' ) {
			isFlippedVertically = true; // For anchor adjustment only
		}
	}

	return { dx, dy, isFlippedHorizontally, isFlippedVertically };
};

const PositionedAnnotation: FC< LineChartAnnotation > = ( {
	datum,
	title,
	subtitle,
	subjectType = 'circle',
	styles: datumStyles,
} ) => {
	const providerTheme = useChartTheme();
	const { xScale, yScale } = useContext( DataContext ) || {};

	if ( ! datum || ! xScale || ! yScale ) return null;

	const x = xScale( datum.date );
	const y = yScale( datum.value );

	if ( typeof x !== 'number' || typeof y !== 'number' ) return null;

	const [ yMin, yMax ] = yScale.range().map( Number );
	const [ xMin, xMax ] = xScale.range().map( Number );

	// Deep merge styles to preserve nested object properties
	const styles = merge( {}, providerTheme.annotationStyles, datumStyles );

	const { dx, dy, isFlippedHorizontally, isFlippedVertically } = getLabelPosition( {
		subjectType,
		x,
		xMax,
		y,
		yMin,
		yMax,
		maxWidth: styles?.label?.maxWidth,
	} );

	const getHorizontalAnchor = (): LabelProps[ 'horizontalAnchor' ] => {
		if ( subjectType === 'line-horizontal' ) {
			return isFlippedHorizontally ? 'end' : 'start';
		}

		return undefined;
	};

	const getVerticalAnchor = (): TextProps[ 'verticalAnchor' ] => {
		if ( subjectType === 'line-vertical' ) {
			if ( isFlippedVertically ) {
				// If flipped due to top edge, anchor to top; if flipped due to bottom edge, anchor to bottom
				return y - ANNOTATION_MAX_HEIGHT < yMax ? 'start' : 'end';
			}

			return 'middle';
		}

		return undefined;
	};

	return (
		<Annotation x={ x } y={ y } dx={ dx } dy={ dy }>
			<Connector { ...styles?.connector } />
			{ subjectType === 'circle' && <CircleSubject { ...styles?.circleSubject } /> }
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
			<Label
				title={ title }
				subtitle={ subtitle }
				{ ...styles?.label }
				horizontalAnchor={ getHorizontalAnchor() }
				verticalAnchor={ getVerticalAnchor() }
			/>
		</Annotation>
	);
};

export default PositionedAnnotation;
