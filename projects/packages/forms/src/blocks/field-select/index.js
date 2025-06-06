import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../contact-form/util/block-icons';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-select';
const settings = {
	...defaultSettings,
	title: __( 'Dropdown Field', 'jetpack-forms' ),
	keywords: [
		__( 'Choose', 'jetpack-forms' ),
		__( 'Dropdown', 'jetpack-forms' ),
		__( 'Option', 'jetpack-forms' ),
	],
	description: __(
		'Add a compact select box, that when expanded, allows visitors to choose one value from the list.',
		'jetpack-forms'
	),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path
				fill={ getIconColor() }
				d="M5 4.5H19C19.2761 4.5 19.5 4.72386 19.5 5V19C19.5 19.2761 19.2761 19.5 19 19.5H5C4.72386 19.5 4.5 19.2761 4.5 19V5C4.5 4.72386 4.72386 4.5 5 4.5ZM19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM8.93582 10.1396L8.06396 11.3602L11.9999 14.1716L15.9358 11.3602L15.064 10.1396L11.9999 12.3283L8.93582 10.1396Z"
			/>
		),
	},
	edit,
	attributes: {
		...defaultSettings.attributes,
		options: {
			type: 'array',
			default: [ '' ],
			role: 'content',
		},
	},
	deprecated,
	save,
	example: {
		attributes: {
			options: [
				__( 'First option', 'jetpack-forms' ),
				__( 'Second option', 'jetpack-forms' ),
				__( 'Third option', 'jetpack-forms' ),
			],
		},
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Dropdown', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: { type: 'dropdown', placeholder: __( 'Select one option', 'jetpack-forms' ) },
			},
		],
	},
};

export default {
	name,
	settings,
};
