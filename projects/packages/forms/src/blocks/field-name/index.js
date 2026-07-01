import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import transformsSource from '../shared/settings/transforms.js';
import deprecated from './deprecated.js';
import edit from './edit.js';
import blockIcon from './icon.jsx';
import save from './save.js';
import variations from './variations.js';

export const name = 'field-name';

export const form_editor = {
	category: 'contact-info',
};

const transforms = {
	...transformsSource,
	to: transformsSource.to.filter( transform => ! transform.blocks.includes( 'jetpack/' + name ) ),
};

export const settings = {
	...defaultSettings,
	attributes: {
		...defaultSettings.attributes,
		fieldVariant: {
			type: 'string', // 'name' | 'first-name' | 'last-name'
			default: '',
		},
	},
	title: __( 'Name field', 'jetpack-forms' ),
	description: __( 'Collect the site visitor’s name.', 'jetpack-forms' ),
	icon: blockIcon,
	variations,
	transforms,
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Name', 'jetpack-forms' ),
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
	form_editor,
};
