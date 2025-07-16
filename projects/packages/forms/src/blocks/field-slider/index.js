import { __ } from '@wordpress/i18n';
import SliderIcon from '../input-range/icon';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'field-slider';
const settings = {
	...defaultSettings,
	title: __( 'Slider Field', 'jetpack-forms' ),
	description: __( 'Collect a value from site visitors using a slider field.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: <SliderIcon />,
	},
	edit,
	save,
	supports: {
		...defaultSettings.supports,
		interactivity: true,
	},
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Slider', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input-range',
				attributes: {
					min: 0,
					max: 100,
					value: 50,
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
