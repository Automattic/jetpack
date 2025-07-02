import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'slider-input';
const settings = {
	...defaultSettings,
	title: __( 'Slider input field', 'jetpack-forms' ),
	description: __( 'Collect a value from site visitors using a slider.', 'jetpack-forms' ),
	icon: renderMaterialIcon(
		<Path
			fill={ getIconColor() }
			d="M4 12h16M4 12a2 2 0 1 0 0-4M20 12a2 2 0 1 0 0-4M12 12a2 2 0 1 0 0-4"
		/>
	),
	parent: [ 'jetpack/field-slider' ],
	attributes: {
		...defaultSettings.attributes,
		min: {
			type: 'number',
			default: 0,
		},
		max: {
			type: 'number',
			default: 100,
		},
	},
	edit,
	save,
	example: {
		attributes: {
			min: 0,
			max: 100,
			value: 50,
		},
	},
};

export default {
	name,
	settings,
};
