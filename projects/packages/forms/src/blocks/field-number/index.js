import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../contact-form/util/block-icons';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-number';
const settings = {
	...defaultSettings,
	title: __( 'Number input field', 'jetpack-forms' ),
	description: __( 'Collect numbers from site visitors.', 'jetpack-forms' ),
	icon: renderMaterialIcon(
		<Path
			fill={ getIconColor() }
			d="M12 7H4V8.5H12V7ZM19.75 17.25V10.75H4.25V17.25H19.75ZM5.75 15.75V12.25H18.25V15.75H5.75Z"
		/>
	),
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Number', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'number',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
