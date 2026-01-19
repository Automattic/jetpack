import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import type { AxisScale, TickRendererProps } from '@visx/axis';
import type { FC, CSSProperties } from 'react';

/**
 * Get the bandwidth of a scale
 *
 * @param scale - The scale to get the bandwidth of
 * @return The bandwidth of the scale
 */
const getScaleBandwidth = < Scale extends AxisScale >( scale?: Scale ) => {
	const s = scale as AxisScale;
	return s && 'bandwidth' in s ? s?.bandwidth() ?? 0 : 0;
};

interface TruncatedTickComponentProps extends TickRendererProps {
	/** Which axis this tick belongs to */
	axis: 'x' | 'y';
}

const MINI_TICK_LABEL_LENGTH = 20;

/**
 * A tick component that renders labels with text truncation (ellipsis) when they exceed
 * the available bandwidth. Shows the full text on hover via native title attribute.
 *
 * Uses foreignObject to embed HTML within SVG, enabling CSS text-overflow: ellipsis.
 * Inherits text styles from tickLabelProps passed by visx Axis component.
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
	const maxWidth = Math.max( bandwidth, MINI_TICK_LABEL_LENGTH );

	// Offset to center the text on the tick position
	const xOffset = -maxWidth / 2;

	// Map textAnchor to CSS textAlign
	let textAlign: 'left' | 'right' | 'center' = 'left';
	if ( textAnchor === 'start' ) {
		textAlign = 'left';
	} else if ( textAnchor === 'end' ) {
		textAlign = 'right';
	}

	const textStyles: CSSProperties = {
		// Offset y to convert from baseline to top-left positioning because svg text is positioned by baseline, but html div is positioned by top-left.
		transform: 'translateY(-100%)',
		...( textProps as unknown as CSSProperties ),
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
		<foreignObject
			x={ x + xOffset }
			y={ y }
			width={ maxWidth }
			overflow="visible"
			// dy * 2: The div's translateY(-100%) and visx's pre-calculated y offset
			// create a compound effect that requires doubling dy to match original text position.
			style={ { transform: `translateY(calc(${ dy ?? '0' } * 2))` } }
		>
			<div style={ textStyles } title={ formattedValue || '' }>
				{ formattedValue }
			</div>
		</foreignObject>
	);
};

export const createTruncatedTickComponent = ( axis: 'x' | 'y' ) => ( props: TickRendererProps ) => {
	return <TruncatedTickComponent { ...props } axis={ axis } />;
};
