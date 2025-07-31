import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

/**
 * Gets the min and max values from the context object.
 *
 * @param {object} context - The interactivity context for the current slider field.
 * @return {{min: number, max: number}} The min and max values for the slider.
 */
function getSliderMinMax( context ) {
	const min = typeof context.min !== 'undefined' ? Number( context.min ) : 0;
	const max = typeof context.max !== 'undefined' ? Number( context.max ) : 100;
	return { min, max };
}

store( NAMESPACE, {
	state: {
		get getSliderValue() {
			const context = getContext();
			const { min } = getSliderMinMax( context );
			// Use context.default if fieldValue is not set
			return context.fieldValue ?? context.default ?? min ?? 0;
		},
		get getSliderPosition() {
			const context = getContext();
			const { min, max } = getSliderMinMax( context );
			let value = Number( context.fieldValue ?? context.default ?? min );
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
