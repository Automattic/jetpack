import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'field-slider';
const settings = {
	...defaultSettings,
	title: __( 'Slider Field', 'jetpack-forms' ),
	description: __( 'Collect a value from site visitors using a slider field.', 'jetpack-forms' ),
	icon: renderMaterialIcon(
		<Path
			fill={ getIconColor() }
			d="M4 12h16M4 12a2 2 0 1 0 0-4M20 12a2 2 0 1 0 0-4M12 12a2 2 0 1 0 0-4"
		/>
	),
	edit,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Slider', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/slider-input',
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
