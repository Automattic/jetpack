export type SlotRect = { x: number; y: number; width: number; height: number };

type ValueScale = ( ( v: number ) => number ) & { range: () => unknown[] };

/**
 * Mirrors visx's getScaleBaseline so bars drawn outside visx share the baseline of its bars, including out-of-domain zero values.
 *
 * @param {ValueScale} scale - The continuous value scale.
 * @return {number} The baseline output position in pixels.
 */
export function getValueScaleBaseline( scale: ValueScale ): number {
	const [ a, b ] = scale.range().map( r => Number( r ) || 0 );
	const isDescending = b < a;
	const maybeZero = scale( 0 );
	const [ minOutput, maxOutput ] = isDescending ? [ b, a ] : [ a, b ];
	if ( isDescending ) {
		return Number.isFinite( maybeZero )
			? Math.min( Math.max( minOutput, maybeZero ), maxOutput )
			: maxOutput;
	}
	return Number.isFinite( maybeZero ) ? Math.max( maybeZero, minOutput ) : minOutput;
}

/**
 * Compute the rect that spans `valuePositions` along the value axis, centered on a slot and scaled by `widthFactor` across it.
 *
 * @param {object}   params                - Geometry inputs.
 * @param {boolean}  params.horizontal     - True for a horizontal bar chart, false for vertical.
 * @param {number}   params.bandPosition   - bandScale(category): start px of the category band.
 * @param {number}   params.slotOffset     - groupScale(slotKey): offset of the slot within the band.
 * @param {number}   params.slotThickness  - groupScale.bandwidth(): slot thickness in px.
 * @param {number[]} params.valuePositions - Output px the rect must reach, such as the baseline and each bar's value.
 * @param {number}   params.widthFactor    - Thickness multiplier, e.g. 0.5 for half the slot.
 * @return {SlotRect} The {x, y, width, height} of the rect.
 */
export function computeSlotRect( params: {
	horizontal: boolean;
	bandPosition: number;
	slotOffset: number;
	slotThickness: number;
	valuePositions: number[];
	widthFactor: number;
} ): SlotRect {
	const { horizontal, bandPosition, slotOffset, slotThickness, valuePositions, widthFactor } =
		params;
	const thickness = slotThickness * widthFactor;
	const start = bandPosition + slotOffset + slotThickness / 2 - thickness / 2;
	const valueStart = Math.min( ...valuePositions );
	const valueLength = Math.max( ...valuePositions ) - valueStart;

	if ( horizontal ) {
		return { x: valueStart, y: start, width: valueLength, height: thickness };
	}
	return { x: start, y: valueStart, width: thickness, height: valueLength };
}
