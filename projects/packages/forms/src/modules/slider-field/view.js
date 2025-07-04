// Jetpack Slider Field Interactivity (empty for now)

import { store, getContext } from '@wordpress/interactivity';

store( 'jetpack/field-slider', {
	state: {
		get getFieldValue() {
			const context = getContext();
			return context.fieldValue || context.fieldExtra?.min || 0;
		},
		get getIndicatorPosition() {
			const context = getContext();
			const min = Number( context.fieldExtra?.min ?? 0 );
			const max = Number( context.fieldExtra?.max ?? 100 );
			let value = Number( context.fieldValue ?? min );
			value = value < min ? min : value;
			value = value > max ? max : value;
			const percent = ( ( value - min ) * 100 ) / ( max - min );

			// Magic numbers: 8px base offset, 0.15px per percent
			return `calc(${ percent }% + (${ 8 - percent * 0.15 }px))`;
		},
	},
	actions: {
		onFieldChange( event ) {
			const context = getContext();
			context.fieldValue = event.target.value;
		},
	},
} );
