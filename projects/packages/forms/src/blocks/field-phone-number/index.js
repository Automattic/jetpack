import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'field-phone-number';
const settings = {
	apiVersion: 3,
	...defaultSettings,
	title: __( 'Phone Number field', 'jetpack-forms' ),
	description: __( 'Allow visitors to enter an international phone number.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
		),
	},
	attributes: {
		...defaultSettings.attributes,
	},
	allowedBlocks: [ 'jetpack/label', 'jetpack/phone-number-input' ],
	providesContext: {
		'jetpack/field-share-attributes': 'shareFieldAttributes',
	},
	edit,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Phone Number', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/phone-number-input',
			},
		],
	},
};

export default { name, settings };
