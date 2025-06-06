import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../contact-form/util/block-icons';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-checkbox-multiple';
const settings = {
	...defaultSettings,
	title: __( 'Multiple choice (checkbox)', 'jetpack-forms' ),
	keywords: [ __( 'Choose multiple', 'jetpack-forms' ), __( 'Option', 'jetpack-forms' ) ],
	description: __(
		'Offer users a list of choices, and allow them to select multiple options.',
		'jetpack-forms'
	),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path d="M7.0812 10.1419L10.6001 5.45005L9.40006 4.55005L6.91891 7.85824L5.53039 6.46972L4.46973 7.53038L7.0812 10.1419ZM12 8.5H20V7H12V8.5ZM12 17H20V15.5H12V17ZM8.5 14.5H5.5V17.5H8.5V14.5ZM5.5 13H8.5C9.32843 13 10 13.6716 10 14.5V17.5C10 18.3284 9.32843 19 8.5 19H5.5C4.67157 19 4 18.3284 4 17.5V14.5C4 13.6716 4.67157 13 5.5 13Z" />
		),
	},
	edit,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Choose several options', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/options',
				attributes: {
					type: 'checkbox',
				},
				innerBlocks: [
					{
						name: 'jetpack/option',
						attributes: {
							label: __( 'First option', 'jetpack-forms' ),
						},
					},
					{
						name: 'jetpack/option',
						attributes: {
							label: __( 'Second option', 'jetpack-forms' ),
						},
					},
					{
						name: 'jetpack/option',
						attributes: {
							label: __( 'Third option', 'jetpack-forms' ),
						},
					},
				],
			},
		],
	},
	allowedBlocks: [ 'jetpack/label', 'jetpack/field-options' ],
	deprecated,
	save,
	styles: [
		{ name: 'list', label: __( 'List', 'jetpack-forms' ), isDefault: true },
		{ name: 'button', label: __( 'Button', 'jetpack-forms' ) },
	],
};

export default {
	name,
	settings,
};
