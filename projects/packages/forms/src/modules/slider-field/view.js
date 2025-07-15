// Jetpack Slider Field Interactivity (empty for now)

import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

store( NAMESPACE, {
	state: {
		get getSliderValue() {
			const context = getContext();
			return context.sliderValue || context.sliderMin || 0;
		},
		get getSliderPosition() {
			const context = getContext();
			const min = Number( context.sliderMin ?? 0 );
			const max = Number( context.sliderMax ?? 100 );
			let value = Number( context.sliderValue ?? min );
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
			context.sliderValue = event.target.value;
		},
	},
} );
