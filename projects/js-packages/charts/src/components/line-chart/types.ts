import { CircleSubjectProps } from '@visx/annotation/lib/components/CircleSubject';
import { ConnectorProps } from '@visx/annotation/lib/components/Connector';
import { LabelProps } from '@visx/annotation/lib/components/Label';
import { LineSubjectProps } from '@visx/annotation/lib/components/LineSubject';

export type AnnotationStyles = {
	circleSubject?: Omit< CircleSubjectProps, 'x' | 'y' > & { fill?: string };
	lineSubject?: Omit< LineSubjectProps, 'x' | 'y' >;
	connector?: Omit< ConnectorProps, 'x' | 'y' | 'dx' | 'dy' >;
	label?: Omit< LabelProps, 'title' | 'subtitle' | 'x' | 'y' > & {
		x?: number | 'start' | 'end';
		y?: number | 'start' | 'end';
	};
};
