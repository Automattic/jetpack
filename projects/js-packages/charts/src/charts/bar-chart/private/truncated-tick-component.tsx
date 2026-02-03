import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import { isSafari } from '../../../utils';
import type { AxisScale, TickRendererProps } from '@visx/axis';
import type { FC, CSSProperties } from 'react';

/**
 * Get the bandwidth of a scale
 *
 * @param scale - The scale to get the bandwidth of
 * @return The bandwidth of the scale
 */
const getScaleBandwidth = < Scale extends AxisScale >( scale?: Scale ) => {
	return scale && 'bandwidth' in scale ? scale.bandwidth() ?? 0 : 0;
};
interface TruncatedTickComponentProps extends TickRendererProps {
	/** Which axis this tick belongs to */
	axis: 'x' | 'y';
}

/**
 * Minimum width in pixels for tick labels when scale bandwidth is very small.
 * Prevents labels from collapsing to unreadable widths on dense charts.
 *
 * Trade-off: When bandwidth is less than this minimum (e.g., many bars in a narrow chart),
 * adjacent labels may overlap since each label uses this minimum width regardless of
 * available space. This prioritizes label readability over preventing overlap.
 *
 * For very dense charts where overlap occurs, consider:
 * - Using `numTicks` option to reduce the number of displayed labels
 * - Using `tickFormat` to abbreviate label text
 * - Increasing chart width or reducing data points
 */
const MIN_TICK_LABEL_WIDTH = 20;

/**
 * A tick component that renders labels with text truncation (ellipsis) when they exceed
 * the available bandwidth. Shows the full text on hover via native title attribute.
 *
 * Uses foreignObject to embed HTML within SVG, enabling CSS text-overflow: ellipsis.
 * Inherits text styles from tickLabelProps passed by visx Axis component.
 *
 * Note: A minimum label width (MIN_TICK_LABEL_WIDTH) is enforced to keep labels readable.
 * On very dense charts where bandwidth < 20px, this may cause label overlap.
 * See MIN_TICK_LABEL_WIDTH documentation for mitigation strategies.
 *
 * @param props                - The props for the truncated tick component
 * @param props.x              - The x position of the tick
 * @param props.y              - The y position of the tick
 * @param props.formattedValue - The formatted value of the tick
 * @param props.axis           - The axis this tick belongs to
 * @param props.textAnchor     - The text anchor of the tick
 * @param props.fill           - The fill color of the tick
 * @param props.dy             - The dy offset of the tick
 *
 * @return The truncated tick component
 */
export const TruncatedTickComponent: FC< TruncatedTickComponentProps > = ( {
	x,
	y,
	formattedValue,
	axis,
	textAnchor,
	fill,
	dy,
	...textProps
} ) => {
	// Get max width of the tick label
	const { xScale, yScale } = useContext( DataContext ) || {};
	const scale = axis === 'x' ? xScale : yScale;
	const bandwidth = getScaleBandwidth( scale );
	const maxWidth = Math.max( bandwidth, MIN_TICK_LABEL_WIDTH );

	// Map SVG textAnchor to CSS textAlign
	let textAlign: 'left' | 'right' | 'center' = 'center';
	if ( textAnchor === 'start' ) {
		textAlign = 'left';
	} else if ( textAnchor === 'end' ) {
		textAlign = 'right';
	} else if ( textAnchor === 'middle' ) {
		textAlign = 'center';
	}

	// Calculate x offset based on text alignment
	let xOffset = 0;
	if ( textAlign === 'center' ) {
		xOffset = -maxWidth / 2;
	} else if ( textAlign === 'right' ) {
		xOffset = -maxWidth;
	}

	// Extract compatible style properties from SVG text props
	const { fontSize, fontFamily, fontWeight, fontStyle, letterSpacing, opacity } = textProps as {
		fontSize?: CSSProperties[ 'fontSize' ];
		fontFamily?: CSSProperties[ 'fontFamily' ];
		fontWeight?: CSSProperties[ 'fontWeight' ];
		fontStyle?: CSSProperties[ 'fontStyle' ];
		letterSpacing?: CSSProperties[ 'letterSpacing' ];
		opacity?: CSSProperties[ 'opacity' ];
	};

	const textStyles: CSSProperties = {
		/**
		 * SVG <text> elements are vertically aligned to the baseline by default, but HTML <div> elements inside <foreignObject>
		 * are positioned relative to the top-left corner. To visually align the tick label like SVG text,
		 * we shift the div up by 100% of its height and adjust by twice the SVG dy value (from visx) to approximate original placement.
		 */
		transform: `translateY(calc(-100% + ${ dy ?? '0' } * 2))`,
		// Safari doesn't work well with foreignObject positioning. Use position: fixed as a workaround.
		...( isSafari() ? { position: 'fixed' as const } : {} ),
		// Apply compatible SVG text styles
		fontSize,
		fontFamily,
		fontWeight,
		fontStyle,
		letterSpacing,
		opacity,
		// Convert svg text styles to CSS styles for the div
		color: fill ?? 'inherit',
		textAlign,
		// Ensure text is truncated with ellipsis, remains on one line, and shows the full value in a tooltip on hover.
		// The surrounding div uses CSS to handle overflow, and the 'title' attribute is set for accessibility.
		width: maxWidth,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		cursor: 'default',
		pointerEvents: 'auto',
	};

	return (
		<foreignObject x={ x + xOffset } y={ y } width={ maxWidth } height={ 0 } overflow="visible">
			<div style={ textStyles } title={ formattedValue }>
				{ formattedValue }
			</div>
		</foreignObject>
	);
};

/**
 * Factory function to create a truncated tick component for a specific axis.
 * Returns a component that can be passed to visx's tickComponent prop.
 *
 * @param axis - The axis this tick component is for ('x' or 'y')
 * @return A tick component function compatible with visx's TickRendererProps
 */
const createTruncatedTickComponent = ( axis: 'x' | 'y' ) => ( props: TickRendererProps ) => {
	return <TruncatedTickComponent { ...props } axis={ axis } />;
};

/**
 * Pre-created tick components for x and y axes.
 * These functions are created once at module initialization and reused,
 * avoiding repeated factory calls when configuring axes.
 */
export const TruncatedXTickComponent = createTruncatedTickComponent( 'x' );
export const TruncatedYTickComponent = createTruncatedTickComponent( 'y' );
