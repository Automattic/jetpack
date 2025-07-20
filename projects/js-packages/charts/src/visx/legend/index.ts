// Re-export Group component from visx
import {
	LineShape as VisxLineShape,
	CircleShape as VisxCircleShape,
	RectShape as VisxRectShape,
} from '@visx/legend';

// Re-export with preserved module structure
export const LineShape = VisxLineShape;
export const CircleShape = VisxCircleShape;
export const RectShape = VisxRectShape;
