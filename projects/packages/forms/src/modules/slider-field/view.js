import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

/**
 * Gets the min and max values from the slider input element within the current context node.
 *
 * @param {object} context - The interactivity context for the current slider field.
 * @return {{min: number, max: number}} The min and max values for the slider.
 */
function getSliderMinMax( context ) {
	const root = context._rootNode || document;
	const input = root.querySelector( 'input[type="range"]' );
	const min = input ? Number( input.getAttribute( 'min' ) ) : 0;
	const max = input ? Number( input.getAttribute( 'max' ) ) : 100;
	return { min, max };
}

store( NAMESPACE, {
	state: {
		get getSliderValue() {
			const context = getContext();
			const { min } = getSliderMinMax( context );
			return context.fieldValue || min || 0;
		},
		get getSliderPosition() {
			const context = getContext();
			const { min, max } = getSliderMinMax( context );
			let value = Number( context.fieldValue ?? min );
			value = value < min ? min : value;
			value = value > max ? max : value;
			const percent = ( ( value - min ) * 100 ) / ( max - min );

			// Magic numbers: 8px base offset, 0.15px per percent
			return `calc(${ percent }% + (${ 8 - percent * 0.15 }px))`;
		},
	},
	actions: {
		onSliderChange( event ) {
			const context = getContext();
			context.fieldValue = event.target.value;
		},
	},
} );
