import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon.js';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import save from './save.js';

const name = 'field-text';
const settings = {
	...defaultSettings,
	formEditorCategory: 'input',
	title: __( 'Text input field', 'jetpack-forms' ),
	description: __( 'Collect short text responses from site visitors.', 'jetpack-forms' ),
	icon: {
		src: renderMaterialIcon(
			<Path d="M12 7H4V8.5H12V7ZM19.75 17.25V10.75H4.25V17.25H19.75ZM5.75 15.75V12.25H18.25V15.75H5.75Z" />
		),
	},
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Text', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'text',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
