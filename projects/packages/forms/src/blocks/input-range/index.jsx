import { __ } from '@wordpress/i18n';
import edit from './edit.jsx';
import RangeIcon from './icon.jsx';
import save from './save.jsx';

const name = 'input-range';
const settings = {
	apiVersion: 3,
	title: __( 'Slider input', 'jetpack-forms' ),
	description: __( 'A slider input for selecting a value.', 'jetpack-forms' ),
	icon: <RangeIcon />,
	category: 'contact-form',
	parent: [ 'jetpack/field-slider' ],
	edit,
	save,
	usesContext: [
		'jetpack/field-slider-min',
		'jetpack/field-slider-max',
		'jetpack/field-slider-default',
		'jetpack/field-slider-onChangeDefault',
		'jetpack/field-slider-onChangeMin',
		'jetpack/field-slider-onChangeMax',
		'jetpack/field-slider-step',
		'jetpack/field-slider-minLabel',
		'jetpack/field-slider-maxLabel',
		'jetpack/field-slider-onChangeMinLabel',
		'jetpack/field-slider-onChangeMaxLabel',
	],
	supports: {
		reusable: false,
		html: false,
		// FORMS-694: inputs are inert for visibility (output discarded by the
		// field renderer); disable the control like the standard input block.
		visibility: false,
		color: {
			text: true,
			background: false,
		},
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
	},
};

export default { name, settings };
