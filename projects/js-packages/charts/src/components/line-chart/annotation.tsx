import { Annotation, CircleSubject, Connector, Label, LineSubject } from '@visx/annotation';
import { CircleSubjectProps } from '@visx/annotation/lib/components/CircleSubject';
import { ConnectorProps } from '@visx/annotation/lib/components/Connector';
import { LineSubjectProps } from '@visx/annotation/lib/components/LineSubject';
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

export type LineChartAnnotation = {
	datum: DataPointDate;
	title: string;
	subtitle: string;
	subjectType?: 'circle' | 'line-vertical' | 'line-horizontal';
	styles?: AnnotationStyles;
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
	if ( ! xScale || ! yScale ) return null;

	// Convert datum values to chart coordinates using the scales
	const x = xScale( datum.date );
	const y = yScale( datum.value );

	if ( typeof x !== 'number' || typeof y !== 'number' ) return null;

	// Get the chart's coordinate ranges
	const [ yMin, yMax ] = yScale.range().map( Number );
	const [ xMin, xMax ] = xScale.range().map( Number );

	// Deep merge styles to preserve nested object properties
	const styles = merge( {}, providerTheme.annotationStyles, datumStyles );

	const getLabelPosition = () => {
		let dx = 15;
		let dy = 15;

		if ( subjectType === 'line-horizontal' ) {
			dx = 0;
			dy = 20;
		}

		if ( subjectType === 'line-vertical' ) {
			dx = 20;
			dy = 0;
		}

		return { dx, dy };
	};

	return (
		<Annotation x={ x } y={ y } { ...getLabelPosition() }>
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
				horizontalAnchor={ subjectType === 'line-horizontal' ? 'start' : undefined }
			/>
		</Annotation>
	);
};

export default PositionedAnnotation;
