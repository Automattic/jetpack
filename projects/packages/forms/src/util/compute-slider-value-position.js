/**
 * Compute the CSS left value for the slider value indicator
 * so it stays centered above the thumb. Used for both editor
 * and frontend for slider field.
 *
 * @param {number|string} minParam   - Minimum slider value
 * @param {number|string} maxParam   - Maximum slider value
 * @param {number|string} valueParam - Current slider value
 * @return {string} CSS calc expression for the left position
 */
export function computeSliderValuePosition( minParam, maxParam, valueParam ) {
	const min = Number( minParam );
	const max = Number( maxParam );
	let value = Number( valueParam );

	// Fallbacks and clamping
	value = Number.isNaN( value ) ? min : value;
	value = Math.max( min, Math.min( value, max ) );

	const percent = ( ( value - min ) * 100 ) / ( max - min );
	// Magic numbers: 16px base offset, 0.32px per percent
	return `calc(${ percent }% + (${ 16 - percent * 0.32 }px))`;
}
